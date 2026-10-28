import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Stage,
  Layer,
  Rect,
  Image as KonvaImage,
  Group,
  Transformer,
  Line,
  Text as KonvaText,
} from "react-konva";
import type Konva from "konva";
import {
  Type,
  Plus,
  Minus,
  Trash2,
  Copy,
  RotateCcw,
  RotateCw,
  Layers,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Undo2,
  Redo2,
  MapPin,
  Heart,
  QrCode,
  UploadCloud,
  Shapes,
  Palette,
  LayoutTemplate,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lock,
  Unlock,
  Radio,
  Check,
  Image as ImageIcon,
  HelpCircle,
  Search,
  ArrowUp,
  ArrowDown,
  Edit3,
} from "lucide-react";
import { CANVA_FONTS, loadGoogleFont } from "@/lib/fonts";

// Standard A6 Dimensions: 105 mm x 148 mm (Ratio 1:1.414)
export const MM_TO_PX = 4;
export const A6_WIDTH_MM = 105;
export const A6_HEIGHT_MM = 148;
export const A6_WIDTH_PX = A6_WIDTH_MM * MM_TO_PX; // 420 px
export const A6_HEIGHT_PX = A6_HEIGHT_MM * MM_TO_PX; // 592 px
export const SAFE_MARGIN_PX = 4 * MM_TO_PX; // 16 px (4 mm safe print area)

export type CanvasElementType = "text" | "qr" | "logo" | "sticker" | "panel";

export type StickerKey =
  | "google"
  | "googleBadge"
  | "nfc"
  | "nfcWhite"
  | "nfcDark"
  | "nfcColor"
  | "star5"
  | "star1"
  | "location"
  | "heart";

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  x: number; // in mm
  y: number; // in mm
  width: number; // in mm
  height: number; // in mm
  rotation?: number | undefined; // in degrees
  cornerRadius?: number | undefined; // in mm
  stroke?: string | undefined;
  // Text Properties
  text?: string | undefined;
  fontSize?: number | undefined; // in pt
  fontFamily?: string | undefined;
  fill?: string | undefined;
  fontWeight?: ("normal" | "bold" | "800") | undefined;
  fontStyle?: ("normal" | "italic") | undefined;
  align?: ("left" | "center" | "right") | undefined;
  // Sticker / Image Properties
  src?: string | undefined;
  stickerType?: StickerKey | undefined;
  // QR Specific Properties
  qrFrame?: ("white" | "none" | "dark") | undefined;
  [key: string]: unknown;
}

// ---------------- OFFICIAL REAL NFC LOGOS (Standard Badge, White, Dark, and Multicolor) ----------------
export const REAL_NFC_BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 400 400"><circle cx="200" cy="200" r="195" fill="#ffffff" stroke="#e2e8f0" stroke-width="6"/><g fill="none" stroke="#111827" stroke-linecap="round"><path d="M 120 140 C 148 170 148 200 120 230" stroke-width="24"/><path d="M 160 115 C 198 155 198 215 160 255" stroke-width="26"/><path d="M 200 90 C 248 140 248 230 200 280" stroke-width="28"/><path d="M 240 65 C 298 125 298 245 240 305" stroke-width="30"/></g><text x="200" y="375" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="62" font-weight="900" text-anchor="middle" letter-spacing="6" fill="#111827">NFC</text></svg>`;

export const REAL_NFC_WHITE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 400 400"><g fill="none" stroke="#ffffff" stroke-linecap="round"><path d="M 120 140 C 148 170 148 200 120 230" stroke-width="26"/><path d="M 160 115 C 198 155 198 215 160 255" stroke-width="28"/><path d="M 200 90 C 248 140 248 230 200 280" stroke-width="30"/><path d="M 240 65 C 298 125 298 245 240 305" stroke-width="32"/></g><text x="200" y="375" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="64" font-weight="900" text-anchor="middle" letter-spacing="6" fill="#ffffff">NFC</text></svg>`;

export const REAL_NFC_DARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 400 400"><g fill="none" stroke="#111827" stroke-linecap="round"><path d="M 120 140 C 148 170 148 200 120 230" stroke-width="26"/><path d="M 160 115 C 198 155 198 215 160 255" stroke-width="28"/><path d="M 200 90 C 248 140 248 230 200 280" stroke-width="30"/><path d="M 240 65 C 298 125 298 245 240 305" stroke-width="32"/></g><text x="200" y="375" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="64" font-weight="900" text-anchor="middle" letter-spacing="6" fill="#111827">NFC</text></svg>`;

export const REAL_NFC_COLOR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 400 400"><circle cx="200" cy="200" r="195" fill="#ffffff" stroke="#e2e8f0" stroke-width="6"/><g fill="none" stroke-linecap="round"><path d="M 120 140 C 148 170 148 200 120 230" stroke="#4285F4" stroke-width="26"/><path d="M 160 115 C 198 155 198 215 160 255" stroke="#EA4335" stroke-width="28"/><path d="M 200 90 C 248 140 248 230 200 280" stroke="#FBBC05" stroke-width="30"/><path d="M 240 65 C 298 125 298 245 240 305" stroke="#34A853" stroke-width="32"/></g><text x="200" y="375" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="62" font-weight="900" text-anchor="middle" letter-spacing="6" fill="#1e293b">NFC</text></svg>`;

// Vector Sticker SVGs encoded as Data URLs for instant crisp rendering
export const STICKER_SVGS: Record<StickerKey, string> = {
  google:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><g transform="translate(46, 46)"><path fill="#4285F4" d="M106.85 55.21c0-3.15-.27-6.3-8.55-9.31H54v20.29h29.7c-1.3 6.84-5.13 12.6-10.8 16.56v13.72h17.46c10.21-9.4 16.49-23.26 16.49-41.26z"/><path fill="#34A853" d="M54 108c14.58 0 26.77-4.86 35.68-13.09l-17.46-13.72c-4.86 3.24-11.02 5.22-18.22 5.22-14.04 0-25.96-9.45-30.24-22.18H5.62v14.17C14.67 96.12 33.12 108 54 108z"/><path fill="#FBBC05" d="M23.76 64.23c-1.12-3.24-1.71-6.7-1.71-10.23s.59-6.99 1.71-10.23V29.6H5.62C1.98 36.81 0 45.09 0 54s1.98 17.19 5.62 24.4l18.14-14.17z"/><path fill="#EA4335" d="M54 21.37c7.96 0 15.07 2.74 20.7 8.1l15.39-15.39C80.73 5.35 68.54 0 54 0 33.12 0 14.67 11.88 5.62 29.6l18.14 14.17c4.28-12.73 16.2-22.4 30.24-22.4z"/></g></svg>`,
    ),
  googleBadge:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60" viewBox="0 0 300 60"><g transform="translate(10, 10)"><path fill="#4285F4" d="M38.85 20.21c0-1.15-.1-2.3-.31-3.39H20v7.38h10.8c-.47 2.49-1.87 4.58-3.93 6.02v4.99h6.35c3.71-3.42 5.63-8.46 5.63-15z"/><path fill="#34A853" d="M20 39.42c5.3 0 9.73-1.77 12.98-4.76l-6.35-4.99c-1.77 1.18-4.01 1.9-6.63 1.9-5.11 0-9.44-3.44-11-8.07H2.04v5.15C5.33 35.08 12.04 39.42 20 39.42z"/><path fill="#FBBC05" d="M9 23.5c-.41-1.18-.62-2.44-.62-3.72s.21-2.54.62-3.72V10.91H2.04C.72 13.53 0 16.54 0 19.78s.72 6.25 2.04 8.87L9 23.5z"/><path fill="#EA4335" d="M20 7.78c2.9 0 5.48 1 7.53 2.95l5.6-5.6C29.73 1.95 25.3 0 20 0 12.04 0 5.33 4.34 2.04 10.91l6.96 5.15C10.56 11.22 14.89 7.78 20 7.78z"/></g><text x="65" y="38" font-family="'Plus Jakarta Sans', system-ui, sans-serif" font-size="24" font-weight="700" fill="#1e293b">Google Reviews</text></svg>`,
    ),
  nfc: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(REAL_NFC_BADGE_SVG),
  nfcWhite: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(REAL_NFC_WHITE_SVG),
  nfcDark: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(REAL_NFC_DARK_SVG),
  nfcColor: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(REAL_NFC_COLOR_SVG),
  star5:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="56" viewBox="0 0 160 26"><g fill="#f59e0b">${[
        0, 1, 2, 3, 4,
      ]
        .map(
          (i) =>
            `<path transform="translate(${i * 32 + 4}, 1)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>`,
        )
        .join("")}</g></svg>`,
    ),
  star1:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><path fill="#f59e0b" transform="translate(40, 40) scale(5)" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    ),
  location:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><path fill="#EA4335" transform="translate(45, 35) scale(4.6)" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/><circle cx="100" cy="76" r="11" fill="#ffffff"/></svg>`,
    ),
  heart:
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100" fill="#ffffff"/><path fill="#059669" transform="translate(40, 40) scale(5)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
    ),
};

export const CANVA_PALETTE = [
  "#ffffff",
  "#000000",
  "#1a73e8",
  "#065f46",
  "#d97706",
  "#991b1b",
  "#4338ca",
  "#0f172a",
  "#64748b",
  "#f1f5f9",
];

export function isLightColor(colorHex?: string): boolean {
  if (!colorHex || !colorHex.startsWith("#")) return true;
  const hex = colorHex.replace("#", "");
  if (hex.length === 3) {
    const c0 = hex[0] || "f";
    const c1 = hex[1] || "f";
    const c2 = hex[2] || "f";
    const r = parseInt(c0 + c0, 16);
    const g = parseInt(c1 + c1, 16);
    const b = parseInt(c2 + c2, 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  }
  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  }
  return true;
}

export const TEMPLATE_PRESETS = [
  {
    id: "clean-white",
    name: "Minimal Light",
    color: "#ffffff",
    headline: "Review Us On Google",
    tag: "Modern Clean (Recommended)",
  },
  {
    id: "google-classic",
    name: "Google Classic",
    color: "#1a73e8",
    headline: "Review Us On Google",
    tag: "Official Blue",
  },
  {
    id: "luxury-onyx",
    name: "Luxury Onyx",
    color: "#18181b",
    headline: "Rate Your Experience",
    tag: "Minimal Dark",
  },
  {
    id: "artisan-emerald",
    name: "Artisan Emerald",
    color: "#065f46",
    headline: "Review Us On Google",
    tag: "Bakery & Cafe",
  },
  {
    id: "ruby-bistro",
    name: "Ruby Bistro",
    color: "#991b1b",
    headline: "Review Us On Google",
    tag: "Fine Dining",
  },
  {
    id: "warm-amber",
    name: "Warm Amber",
    color: "#d97706",
    headline: "Loved Your Visit?",
    tag: "Craft Coffee",
  },
];

// Helper to create initial default A6 Elements exactly matching templet.html
export function createDefaultA6Elements(params: {
  businessName?: string | undefined;
  category?: string | undefined;
  headline?: string | undefined;
  logoUrl?: string | null | undefined;
  cardColor?: string | undefined;
}): CanvasElement[] {
  const bName = params.businessName || "Your Business Name";
  const cat = params.category || "Local Business";
  const cta = params.headline || "Review Us On Google";
  const light = isLightColor(params.cardColor || "#ffffff");

  const textColor = light ? "#0f172a" : "#ffffff";
  const subtextColor = light ? "#475569" : "rgba(255, 255, 255, 0.90)";
  const nfcStickerType = light ? "nfc" : "nfcWhite";

  const elements: CanvasElement[] = [];

  // 1. Business Logo (Top Left Avatar circle 14mm - always present matching templet.html)
  elements.push({
    id: "elem-logo",
    type: "logo",
    x: 8,
    y: 7,
    width: 14,
    height: 14,
    src: params.logoUrl || undefined,
  });

  // 2. Business Display Name (13pt Plus Jakarta Sans bold)
  elements.push({
    id: "elem-biz-name",
    type: "text",
    x: 26,
    y: 7.5,
    width: 71,
    height: 7.5,
    text: bName,
    fontSize: 13,
    fontFamily: "Plus Jakarta Sans, sans-serif",
    fontWeight: "bold",
    fill: textColor,
    align: "left",
  });

  // 3. Category / Subtitle (7pt uppercase Plus Jakarta Sans bold)
  elements.push({
    id: "elem-biz-cat",
    type: "text",
    x: 26,
    y: 15.5,
    width: 71,
    height: 5.5,
    text: cat.toUpperCase(),
    fontSize: 7,
    fontFamily: "Plus Jakarta Sans, sans-serif",
    fontWeight: "bold",
    fill: subtextColor,
    align: "left",
  });

  // 4. White Center Review Panel (89 × 86 mm with 4.5mm rounded corners, like templet.html)
  elements.push({
    id: "elem-review-panel",
    type: "panel",
    x: 8,
    y: 23,
    width: 89,
    height: 86,
    cornerRadius: 4.5,
    fill: light ? "#f8fafc" : "#ffffff",
    stroke: light ? "#e2e8f0" : undefined,
  });

  // 5. Official Google G Badge (Centered at top of review panel)
  elements.push({
    id: "elem-sticker-google",
    type: "sticker",
    stickerType: "google",
    x: 49.5,
    y: 26.5,
    width: 6,
    height: 6,
    src: STICKER_SVGS.google,
  });

  // 6. "Google Reviews" Badge Text (Clickable & Editable)
  elements.push({
    id: "elem-google-text",
    type: "text",
    x: 10,
    y: 33.5,
    width: 85,
    height: 5,
    text: "Google Reviews",
    fontSize: 8.5,
    fontFamily: "Plus Jakarta Sans, sans-serif",
    fontWeight: "bold",
    fill: "#1e293b",
    align: "center",
  });

  // 7. 5-Star Rating Row (Gold stars)
  elements.push({
    id: "elem-sticker-stars",
    type: "sticker",
    stickerType: "star5",
    x: 36,
    y: 39,
    width: 33,
    height: 5.5,
    src: STICKER_SVGS.star5,
  });

  // 8. Review Call to Action Headline (Space Grotesk 11pt bold)
  elements.push({
    id: "elem-cta-headline",
    type: "text",
    x: 10,
    y: 46,
    width: 85,
    height: 7,
    text: cta,
    fontSize: 11,
    fontFamily: "Space Grotesk, sans-serif",
    fontWeight: "bold",
    fill: light ? "#1a73e8" : params.cardColor || "#1a73e8",
    align: "center",
  });

  // 9. QR Code Element (44 × 44 mm in White Frame)
  elements.push({
    id: "elem-qr-code",
    type: "qr",
    x: 30.5,
    y: 54.5,
    width: 44,
    height: 44,
    qrFrame: "white",
  });

  // 10. Short URL text under QR
  elements.push({
    id: "elem-footer-url",
    type: "text",
    x: 10,
    y: 100,
    width: 85,
    height: 5,
    text: "reviewcard.link",
    fontSize: 7,
    fontFamily: "monospace",
    fontWeight: "bold",
    fill: "#64748b",
    align: "center",
  });

  // 11. Real Official NFC Logo (4 Contactless Wave arcs)
  elements.push({
    id: "elem-sticker-nfc",
    type: "sticker",
    stickerType: nfcStickerType,
    x: 23,
    y: 118,
    width: 11,
    height: 11,
    src: light ? STICKER_SVGS.nfc : STICKER_SVGS.nfcWhite,
  });

  // 12. NFC Action Title (8.5pt bold)
  elements.push({
    id: "elem-nfc-title",
    type: "text",
    x: 36.5,
    y: 118,
    width: 55,
    height: 6,
    text: "Tap Phone on Card",
    fontSize: 8.5,
    fontFamily: "Plus Jakarta Sans, sans-serif",
    fontWeight: "bold",
    fill: textColor,
    align: "left",
  });

  // 13. NFC Subtitle Note (6.8pt)
  elements.push({
    id: "elem-nfc-sub",
    type: "text",
    x: 36.5,
    y: 124,
    width: 55,
    height: 5,
    text: "Instant NFC review link",
    fontSize: 6.8,
    fontFamily: "Plus Jakarta Sans, sans-serif",
    fontWeight: "normal",
    fill: subtextColor,
    align: "left",
  });

  return elements;
}

function useLoadedImage(url?: string | null): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!url) {
      setImage(null);
      return;
    }
    let active = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (active) setImage(img);
    };
    img.src = url;
    return () => {
      active = false;
    };
  }, [url]);

  return image;
}

export interface CardCanvaEditorProps {
  customDesign?: string | null | undefined;
  customDesignName?: string | undefined;
  qrDataUrl?: string | undefined;
  logoUrl?: string | null | undefined;
  businessName?: string | undefined;
  category?: string | undefined;
  headline?: string | undefined;
  cardColor?: string | undefined;
  onColorChange?: (color: string) => void;
  elements?: CanvasElement[] | undefined;
  onElementsChange?: ((elements: CanvasElement[]) => void) | undefined;
  onUploadFile?: ((e: React.ChangeEvent<HTMLInputElement>) => void) | undefined;
  onRemoveUpload?: (() => void) | undefined;
  onApplyPreset?: ((preset: (typeof TEMPLATE_PRESETS)[0]) => void) | undefined;
  // Backward compatibility
  qrX?: number | undefined;
  qrY?: number | undefined;
  qrSize?: number | undefined;
  qrFrame?: "white" | "none" | "dark" | undefined;
  qrDotColor?: string | undefined;
  qrBgColor?: string | undefined;
  onChangePosition?: ((x: number, y: number) => void) | undefined;
  onChangeSize?: ((size: number) => void) | undefined;
  onUploadClick?: (() => void) | undefined;
}

export function CardCanvaEditor({
  customDesign,
  customDesignName,
  qrDataUrl,
  logoUrl,
  businessName,
  category,
  headline,
  cardColor = "#ffffff",
  onColorChange,
  elements: controlledElements,
  onElementsChange,
  onUploadFile,
  onRemoveUpload,
  onApplyPreset,
  qrX,
  qrY,
  qrSize,
  qrFrame = "white",
  onChangePosition,
  onChangeSize,
  onUploadClick,
}: CardCanvaEditorProps) {
  // Elements state: controlled or internal (adaptive to Light Mode default)
  const [internalElements, setInternalElements] = useState<CanvasElement[]>(() =>
    createDefaultA6Elements({ businessName, category, headline, logoUrl, cardColor }),
  );

  const elements = controlledElements || internalElements;

  const updateElements = useCallback(
    (newElems: CanvasElement[] | ((prev: CanvasElement[]) => CanvasElement[])) => {
      if (onElementsChange) {
        const resolved = typeof newElems === "function" ? newElems(elements) : newElems;
        onElementsChange(resolved);
      } else {
        setInternalElements(newElems);
      }
    },
    [elements, onElementsChange],
  );

  // Undo / Redo history
  const [history, setHistory] = useState<CanvasElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback(
    (newElems: CanvasElement[]) => {
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), newElems]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1]!;
      setHistoryIndex((i) => i - 1);
      updateElements(prev);
    }
  }, [history, historyIndex, updateElements]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1]!;
      setHistoryIndex((i) => i + 1);
      updateElements(next);
    }
  }, [history, historyIndex, updateElements]);

  // Selection & drag states
  const [selectedId, setSelectedId] = useState<string | null>("elem-qr-code");
  const [isLocked, setIsLocked] = useState(false);
  const [activeGuides, setActiveGuides] = useState<
    Array<{ orientation: "V" | "H"; pos: number; color?: string; label?: string }>
  >([]);
  const [showMarginGuides, setShowMarginGuides] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);

  // Canva Left Drawer State (like Image 1)
  const [activeDrawerTab, setActiveDrawerTab] = useState<
    "templates" | "elements" | "text" | "uploads" | "background"
  >("elements");
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  // Inline editing state for text
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // Clipboard element for Ctrl+C / Ctrl+V
  const [clipboardElement, setClipboardElement] = useState<CanvasElement | null>(null);

  // Font Picker Modal / Popover State (140+ Google Fonts)
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [fontSearch, setFontSearch] = useState("");
  const [fontCategory, setFontCategory] = useState<
    "all" | "sans" | "serif" | "display" | "handwriting" | "mono"
  >("all");

  const filteredFonts = useMemo(() => {
    return CANVA_FONTS.filter((f) => {
      const matchesCategory = fontCategory === "all" || f.category === fontCategory;
      const matchesSearch =
        !fontSearch.trim() || f.name.toLowerCase().includes(fontSearch.toLowerCase().trim());
      return matchesCategory && matchesSearch;
    });
  }, [fontCategory, fontSearch]);

  // File input ref for uploads drawer
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // References
  const stageRef = useRef<Konva.Stage | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);
  const nodeRefs = useRef<Map<string, Konva.Node>>(new Map());

  // Preload background & QR images
  const bgImg = useLoadedImage(customDesign);
  const qrImg = useLoadedImage(qrDataUrl);
  const logoImg = useLoadedImage(logoUrl);

  // Preload sticker images including real NFC logo
  const stickerImages: Record<StickerKey, HTMLImageElement | null> = {
    google: useLoadedImage(STICKER_SVGS.google),
    googleBadge: useLoadedImage(STICKER_SVGS.googleBadge),
    nfc: useLoadedImage(STICKER_SVGS.nfc),
    nfcWhite: useLoadedImage(STICKER_SVGS.nfcWhite),
    nfcDark: useLoadedImage(STICKER_SVGS.nfcDark),
    nfcColor: useLoadedImage(STICKER_SVGS.nfcColor),
    star5: useLoadedImage(STICKER_SVGS.star5),
    star1: useLoadedImage(STICKER_SVGS.star1),
    location: useLoadedImage(STICKER_SVGS.location),
    heart: useLoadedImage(STICKER_SVGS.heart),
  };

  // Sync transformer to selected element
  useEffect(() => {
    if (!transformerRef.current) return;
    const tr = transformerRef.current;
    if (selectedId && nodeRefs.current.has(selectedId) && !isLocked) {
      const node = nodeRefs.current.get(selectedId)!;
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, elements, isLocked]);

  // Selected element helper
  const selectedElement = elements.find((e) => e.id === selectedId);

  // Update selected element property
  const updateSelectedElement = useCallback(
    (updates: Partial<CanvasElement>) => {
      if (!selectedId) return;
      const next = elements.map((elem) =>
        elem.id === selectedId ? { ...elem, ...updates } : elem,
      );
      updateElements(next);
      pushHistory(next);
    },
    [selectedId, elements, updateElements, pushHistory],
  );

  // Drag handlers with magnetic smart guiding lines snapping
  const handleDragMove = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    if (isLocked) return;
    const node = e.target;
    let newX = node.x();
    let newY = node.y();

    const elem = elements.find((x) => x.id === id);
    const elemWidthPx = (elem?.width ?? 20) * MM_TO_PX;
    const elemHeightPx = (elem?.height ?? 20) * MM_TO_PX;

    const guides: Array<{ orientation: "V" | "H"; pos: number; color?: string; label?: string }> = [];
    const SNAP_DIST = 6;

    // 1. Center X Alignment (Card middle: A6_WIDTH_PX / 2)
    const cardCenterX = A6_WIDTH_PX / 2;
    const elemCenterX = newX + elemWidthPx / 2;
    if (Math.abs(elemCenterX - cardCenterX) < SNAP_DIST) {
      newX = cardCenterX - elemWidthPx / 2;
      node.x(newX);
      guides.push({ orientation: "V", pos: cardCenterX, color: "#8b3dff", label: "Center" });
    }

    // 2. Center Y Alignment (Card middle: A6_HEIGHT_PX / 2)
    const cardCenterY = A6_HEIGHT_PX / 2;
    const elemCenterY = newY + elemHeightPx / 2;
    if (Math.abs(elemCenterY - cardCenterY) < SNAP_DIST) {
      newY = cardCenterY - elemHeightPx / 2;
      node.y(newY);
      guides.push({ orientation: "H", pos: cardCenterY, color: "#8b3dff", label: "Center" });
    }

    // 3. Safe Margin X Snapping (4mm print safe margin)
    if (Math.abs(newX - SAFE_MARGIN_PX) < SNAP_DIST) {
      newX = SAFE_MARGIN_PX;
      node.x(newX);
      guides.push({ orientation: "V", pos: SAFE_MARGIN_PX, color: "#06b6d4", label: "Margin" });
    } else if (Math.abs(newX + elemWidthPx - (A6_WIDTH_PX - SAFE_MARGIN_PX)) < SNAP_DIST) {
      newX = A6_WIDTH_PX - SAFE_MARGIN_PX - elemWidthPx;
      node.x(newX);
      guides.push({ orientation: "V", pos: A6_WIDTH_PX - SAFE_MARGIN_PX, color: "#06b6d4", label: "Margin" });
    }

    // 4. Safe Margin Y Snapping
    if (Math.abs(newY - SAFE_MARGIN_PX) < SNAP_DIST) {
      newY = SAFE_MARGIN_PX;
      node.y(newY);
      guides.push({ orientation: "H", pos: SAFE_MARGIN_PX, color: "#06b6d4", label: "Margin" });
    } else if (Math.abs(newY + elemHeightPx - (A6_HEIGHT_PX - SAFE_MARGIN_PX)) < SNAP_DIST) {
      newY = A6_HEIGHT_PX - SAFE_MARGIN_PX - elemHeightPx;
      node.y(newY);
      guides.push({ orientation: "H", pos: A6_HEIGHT_PX - SAFE_MARGIN_PX, color: "#06b6d4", label: "Margin" });
    }

    // 5. Element-to-element alignment
    for (const other of elements) {
      if (other.id === id) continue;
      const otherXPx = other.x * MM_TO_PX;
      const otherWPx = other.width * MM_TO_PX;
      const otherCenterXPx = otherXPx + otherWPx / 2;

      // Vertical Center alignment with another element
      if (
        Math.abs(elemCenterX - otherCenterXPx) < SNAP_DIST &&
        !guides.some((g) => g.orientation === "V" && Math.abs(g.pos - otherCenterXPx) < 2)
      ) {
        newX = otherCenterXPx - elemWidthPx / 2;
        node.x(newX);
        guides.push({ orientation: "V", pos: otherCenterXPx, color: "#3b82f6", label: "Align" });
      }
    }

    setActiveGuides(guides);
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    setActiveGuides([]);
    const node = e.target;
    const mmX = Number((node.x() / MM_TO_PX).toFixed(1));
    const mmY = Number((node.y() / MM_TO_PX).toFixed(1));

    const next = elements.map((elem) => (elem.id === id ? { ...elem, x: mmX, y: mmY } : elem));
    updateElements(next);
    pushHistory(next);

    if (id === "elem-qr-code" && onChangePosition) {
      onChangePosition(mmX, mmY);
    }
  };

  // Transform end handler (Resize / Rotate with width & height update)
  const handleTransformEnd = (id: string) => {
    const node = nodeRefs.current.get(id);
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = Math.round(node.rotation());

    node.scaleX(1);
    node.scaleY(1);

    const elem = elements.find((x) => x.id === id);
    if (!elem) return;

    const newWidthMm = Number(((elem.width * scaleX * MM_TO_PX) / MM_TO_PX).toFixed(1));
    const newHeightMm = Number(((elem.height * scaleY * MM_TO_PX) / MM_TO_PX).toFixed(1));
    const newX = Number((node.x() / MM_TO_PX).toFixed(1));
    const newY = Number((node.y() / MM_TO_PX).toFixed(1));

    const next = elements.map((item) =>
      item.id === id
        ? {
            ...item,
            x: newX,
            y: newY,
            width: Math.max(5, newWidthMm),
            height: Math.max(4, newHeightMm),
            rotation,
          }
        : item,
    );

    updateElements(next);
    pushHistory(next);

    if (id === "elem-qr-code" && onChangeSize) {
      onChangeSize(Math.max(15, newWidthMm));
    }
  };

  // Duplicate Selected Element (Ctrl+D)
  const handleDuplicateSelected = useCallback(() => {
    if (!selectedElement) return;
    const newId = `elem-${Date.now().toString(36)}`;
    const duplicate: CanvasElement = {
      ...selectedElement,
      id: newId,
      x: Math.min(A6_WIDTH_MM - selectedElement.width, selectedElement.x + 4),
      y: Math.min(A6_HEIGHT_MM - selectedElement.height, selectedElement.y + 4),
    };
    const next = [...elements, duplicate];
    updateElements(next);
    pushHistory(next);
    setSelectedId(newId);
  }, [selectedElement, elements, updateElements, pushHistory]);

  // Copy Selected Element (Ctrl+C)
  const handleCopySelected = useCallback(() => {
    if (!selectedElement) return;
    setClipboardElement({ ...selectedElement });
  }, [selectedElement]);

  // Paste Element from Clipboard (Ctrl+V)
  const handlePaste = useCallback(() => {
    if (!clipboardElement) return;
    const newId = `elem-${Date.now().toString(36)}`;
    const pasted: CanvasElement = {
      ...clipboardElement,
      id: newId,
      x: Math.min(A6_WIDTH_MM - clipboardElement.width, clipboardElement.x + 4),
      y: Math.min(A6_HEIGHT_MM - clipboardElement.height, clipboardElement.y + 4),
    };
    const next = [...elements, pasted];
    updateElements(next);
    pushHistory(next);
    setSelectedId(newId);
  }, [clipboardElement, elements, updateElements, pushHistory]);

  // Layer Reordering ([ and ])
  const moveLayer = useCallback(
    (direction: "up" | "down") => {
      if (!selectedId) return;
      const index = elements.findIndex((e) => e.id === selectedId);
      if (index === -1) return;
      const newElements = [...elements];
      if (direction === "up" && index < newElements.length - 1) {
        const temp = newElements[index]!;
        newElements[index] = newElements[index + 1]!;
        newElements[index + 1] = temp;
        updateElements(newElements);
        pushHistory(newElements);
      } else if (direction === "down" && index > 0) {
        const temp = newElements[index]!;
        newElements[index] = newElements[index - 1]!;
        newElements[index - 1] = temp;
        updateElements(newElements);
        pushHistory(newElements);
      }
    },
    [selectedId, elements, updateElements, pushHistory],
  );

  // Delete Selected Element
  const handleDeleteSelected = useCallback(() => {
    if (!selectedId) return;
    const next = elements.filter((e) => e.id !== selectedId);
    updateElements(next);
    pushHistory(next);
    setSelectedId(null);
  }, [selectedId, elements, updateElements, pushHistory]);

  // Add New Text Element
  const handleAddText = (type: "headline" | "subheading" | "body", customText?: string) => {
    const newId = `elem-text-${Date.now().toString(36)}`;
    const isHeadline = type === "headline";
    const isSub = type === "subheading";
    const font = isHeadline
      ? "Space Grotesk, sans-serif"
      : isSub
        ? "Plus Jakarta Sans, sans-serif"
        : "Inter, sans-serif";
    loadGoogleFont(font);
    const newElem: CanvasElement = {
      id: newId,
      type: "text",
      x: 10,
      y: 40,
      width: 85,
      height: isHeadline ? 10 : isSub ? 8 : 6,
      text:
        customText ||
        (isHeadline ? "Add a Heading" : isSub ? "Add a Subheading" : "Add body text here"),
      fontSize: isHeadline ? 15 : isSub ? 10.5 : 8,
      fontFamily: font,
      fontWeight: isHeadline ? "bold" : "normal",
      fill: isLightColor(cardColor) ? "#0f172a" : "#ffffff",
      align: "center",
    };
    const next = [...elements, newElem];
    updateElements(next);
    pushHistory(next);
    setSelectedId(newId);
  };

  // Add Sticker Element
  const handleAddSticker = (stickerType: StickerKey) => {
    const newId = `elem-${stickerType}-${Date.now().toString(36)}`;
    const width =
      stickerType === "googleBadge"
        ? 45
        : stickerType === "star5"
          ? 38
          : stickerType.startsWith("nfc")
            ? 12
            : 16;
    const height =
      stickerType === "googleBadge"
        ? 9
        : stickerType === "star5"
          ? 6.5
          : stickerType.startsWith("nfc")
            ? 12
            : 16;
    const newElem: CanvasElement = {
      id: newId,
      type: "sticker",
      stickerType,
      x: Number(((A6_WIDTH_MM - width) / 2).toFixed(1)),
      y: 50,
      width,
      height,
      src: STICKER_SVGS[stickerType] || STICKER_SVGS.nfc,
    };
    const next = [...elements, newElem];
    updateElements(next);
    pushHistory(next);
    setSelectedId(newId);
  };

  // Reset to Clean Default A6 Card Layout matching templet.html
  const handleResetLayout = () => {
    const fresh = createDefaultA6Elements({
      businessName,
      category,
      headline,
      logoUrl,
      cardColor,
    });
    updateElements(fresh);
    pushHistory(fresh);
    setSelectedId("elem-qr-code");
  };

  // Full Canva Keyboard Shortcuts (Ctrl+C, Ctrl+V, Ctrl+D, Ctrl+Z, Ctrl+Y, Ctrl+B, Ctrl+I, Arrows, Delete, Escape, Enter, [, ])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (isInput) {
        if (e.key === "Escape") {
          setEditingTextId(null);
        }
        return;
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        handlePaste();
        return;
      }

      // Zoom Shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setZoomScale((s) => Math.min(1.5, Number((s + 0.1).toFixed(2))));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "-" || e.key === "_")) {
        e.preventDefault();
        setZoomScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setZoomScale(1);
        return;
      }

      if (!selectedId) return;

      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopySelected();
        return;
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      // Bold Toggle
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        if (selectedElement?.type === "text") {
          updateSelectedElement({
            fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold",
          });
        }
        return;
      }

      // Italic Toggle
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        if (selectedElement?.type === "text") {
          updateSelectedElement({
            fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic",
          });
        }
        return;
      }

      // Enter to Inline Edit text
      if (e.key === "Enter" && !e.shiftKey) {
        if (selectedElement?.type === "text" && !editingTextId) {
          e.preventDefault();
          setEditingTextId(selectedElement.id);
          return;
        }
      }

      // Layer ordering ([ and ])
      if (e.key === "[") {
        e.preventDefault();
        moveLayer("down");
        return;
      }
      if (e.key === "]") {
        e.preventDefault();
        moveLayer("up");
        return;
      }

      // Nudge with Arrow Keys (1mm regular, 5mm with Shift)
      const step = e.shiftKey ? 5 : 1;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        updateSelectedElement({
          x: Math.max(0, (selectedElement?.x ?? 0) - step),
        });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        updateSelectedElement({
          x: Math.min(
            A6_WIDTH_MM - (selectedElement?.width ?? 0),
            (selectedElement?.x ?? 0) + step,
          ),
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        updateSelectedElement({
          y: Math.max(0, (selectedElement?.y ?? 0) - step),
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        updateSelectedElement({
          y: Math.min(
            A6_HEIGHT_MM - (selectedElement?.height ?? 0),
            (selectedElement?.y ?? 0) + step,
          ),
        });
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setEditingTextId(null);
        setSelectedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedId,
    selectedElement,
    editingTextId,
    updateSelectedElement,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleCopySelected,
    handlePaste,
    handleUndo,
    handleRedo,
    moveLayer,
  ]);

  // Tab switch handler for left drawer
  const handleTabClick = (tab: "templates" | "elements" | "text" | "uploads" | "background") => {
    if (activeDrawerTab === tab && isDrawerOpen) {
      setIsDrawerOpen(false);
    } else {
      setActiveDrawerTab(tab);
      setIsDrawerOpen(true);
    }
  };

  return (
    <div className="flex h-full w-full select-none overflow-hidden bg-[#f1f3f5] text-slate-800">
      {/* ---------------- 1. CANVA LEFT VERTICAL ICON STRIP (IMAGE 1) ---------------- */}
      <div className="w-[68px] bg-white border-r border-slate-200/90 flex flex-col items-center py-3 gap-1 shrink-0 z-20 shadow-xs">
        <button
          type="button"
          onClick={() => handleTabClick("elements")}
          className={`w-13 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeDrawerTab === "elements" && isDrawerOpen
              ? "bg-purple-100/80 text-purple-700 font-bold shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
          title="Stickers, Badges & NFC"
        >
          <Shapes className="h-5 w-5" />
          <span className="text-[10px] leading-none">Elements</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("text")}
          className={`w-13 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeDrawerTab === "text" && isDrawerOpen
              ? "bg-purple-100/80 text-purple-700 font-bold shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
          title="Add Text & Headlines"
        >
          <Type className="h-5 w-5" />
          <span className="text-[10px] leading-none">Text</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("uploads")}
          className={`w-13 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeDrawerTab === "uploads" && isDrawerOpen
              ? "bg-purple-100/80 text-purple-700 font-bold shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
          title="Upload Card Artwork or Logo"
        >
          <UploadCloud className="h-5 w-5" />
          <span className="text-[10px] leading-none">Uploads</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("templates")}
          className={`w-13 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeDrawerTab === "templates" && isDrawerOpen
              ? "bg-purple-100/80 text-purple-700 font-bold shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
          title="Curated Card Styles"
        >
          <LayoutTemplate className="h-5 w-5" />
          <span className="text-[10px] leading-none">Styles</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick("background")}
          className={`w-13 py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
            activeDrawerTab === "background" && isDrawerOpen
              ? "bg-purple-100/80 text-purple-700 font-bold shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
          title="Card Base Color"
        >
          <Palette className="h-5 w-5" />
          <span className="text-[10px] leading-none">Color</span>
        </button>

        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
            title="Keyboard Shortcuts"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ---------------- 2. COLLAPSIBLE CANVA SIDE DRAWER (IMAGE 1) ---------------- */}
      {isDrawerOpen && (
        <div className="w-[300px] bg-white border-r border-slate-200/90 overflow-y-auto flex flex-col gap-4 p-4 shrink-0 transition-all z-20 shadow-xs">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 capitalize">
              {activeDrawerTab === "templates"
                ? "Card Styles"
                : activeDrawerTab === "elements"
                  ? "Stickers & Badges"
                  : activeDrawerTab === "text"
                    ? "Add Text"
                    : activeDrawerTab === "uploads"
                      ? "Artwork & Logo"
                      : "Card Color"}
            </h3>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              title="Collapse Drawer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* TAB 1: ELEMENTS & REAL NFC LOGO */}
          {activeDrawerTab === "elements" && (
            <div className="space-y-4">
              {/* Highlight: Official Real NFC Logo Tile (Standard & Multicolor) */}
              <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50/70 to-indigo-50/50 p-3.5 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                    <Radio className="h-3 w-3" /> Official Contactless
                  </span>
                  <span className="text-[9px] font-semibold bg-purple-200/80 text-purple-800 px-1.5 py-0.5 rounded-full">
                    Real NFC
                  </span>
                </div>

                {/* 1. Multicolor NFC Logo Option */}
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-purple-200">
                  <div
                    onClick={() => handleAddSticker("nfcColor")}
                    className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center p-1.5 cursor-pointer shadow-xs hover:scale-105 transition-transform shrink-0"
                    title="Click to add Multicolor Google NFC Badge"
                  >
                    <img src={STICKER_SVGS.nfcColor} alt="Multicolor NFC Logo" className="h-11 w-11" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-slate-900">Multicolor NFC</p>
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded">Google Colors</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      4 brand color arcs: Blue, Red, Yellow & Green.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleAddSticker("nfcColor")}
                      className="mt-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer flex items-center gap-0.5"
                    >
                      + Insert Multicolor
                    </button>
                  </div>
                </div>

                {/* 2. Standard Real NFC Logo */}
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => handleAddSticker("nfc")}
                    className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 cursor-pointer shadow-xs hover:scale-105 transition-transform shrink-0"
                    title="Click to add Standard NFC Badge"
                  >
                    <img src={STICKER_SVGS.nfc} alt="Real NFC Logo" className="h-9 w-9" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900">Standard NFC Badge</p>
                    <button
                      type="button"
                      onClick={() => handleAddSticker("nfc")}
                      className="text-[11px] font-bold text-slate-700 hover:text-purple-700 cursor-pointer"
                    >
                      + Insert Standard
                    </button>
                  </div>
                </div>

                {/* Transparent White & Dark Variants */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-purple-100">
                  <button
                    type="button"
                    onClick={() => handleAddSticker("nfcWhite")}
                    className="py-1 px-2 rounded-lg bg-slate-900 text-white text-[10px] font-semibold flex items-center justify-center gap-1 hover:bg-black cursor-pointer"
                  >
                    White Vector NFC
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddSticker("nfcDark")}
                    className="py-1 px-2 rounded-lg bg-white border text-slate-800 text-[10px] font-semibold flex items-center justify-center gap-1 hover:bg-slate-50 cursor-pointer"
                  >
                    Dark Vector NFC
                  </button>
                </div>
              </div>

              {/* Grid of Other Popular Stickers */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Google & Review Stickers</p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Google G */}
                  <div
                    onClick={() => handleAddSticker("google")}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <img
                      src={STICKER_SVGS.google}
                      alt="Google G"
                      className="h-10 w-10 group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Google G Badge</span>
                  </div>

                  {/* 5-Star Row */}
                  <div
                    onClick={() => handleAddSticker("star5")}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <img
                      src={STICKER_SVGS.star5}
                      alt="5 Stars"
                      className="h-6 w-20 group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">5 Gold Stars</span>
                  </div>

                  {/* Single Star */}
                  <div
                    onClick={() => handleAddSticker("star1")}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <img
                      src={STICKER_SVGS.star1}
                      alt="Gold Star"
                      className="h-10 w-10 group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Single Star</span>
                  </div>

                  {/* Google Maps Pin */}
                  <div
                    onClick={() => handleAddSticker("location")}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <img
                      src={STICKER_SVGS.location}
                      alt="Maps Pin"
                      className="h-10 w-10 group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Maps Pin</span>
                  </div>

                  {/* Heart Review */}
                  <div
                    onClick={() => handleAddSticker("heart")}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <img
                      src={STICKER_SVGS.heart}
                      alt="Heart Badge"
                      className="h-10 w-10 group-hover:scale-105 transition-transform"
                    />
                    <span className="text-[11px] font-semibold text-slate-700">Heart Badge</span>
                  </div>

                  {/* QR Box */}
                  <div
                    onClick={() => {
                      const newId = `elem-qr-${Date.now().toString(36)}`;
                      const next = [
                        ...elements,
                        {
                          id: newId,
                          type: "qr" as CanvasElementType,
                          x: 32.5,
                          y: 80,
                          width: 40,
                          height: 40,
                          qrFrame: "white" as const,
                        },
                      ];
                      updateElements(next);
                      pushHistory(next);
                      setSelectedId(newId);
                    }}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-purple-300 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-2xs group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-slate-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                      <QrCode className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700">
                      + Extra QR Code
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEXT */}
          {activeDrawerTab === "text" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Click to add text</p>

                {/* Heading */}
                <button
                  type="button"
                  onClick={() => handleAddText("headline")}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-purple-50/70 hover:border-purple-300 transition-all text-left flex items-center justify-between cursor-pointer group shadow-2xs"
                >
                  <span className="text-base font-extrabold text-slate-900 font-display">
                    Add a heading
                  </span>
                  <span className="text-[11px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                    16 pt
                  </span>
                </button>

                {/* Subheading */}
                <button
                  type="button"
                  onClick={() => handleAddText("subheading")}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-purple-50/70 hover:border-purple-300 transition-all text-left flex items-center justify-between cursor-pointer group shadow-2xs"
                >
                  <span className="text-xs font-bold text-slate-800">Add a subheading</span>
                  <span className="text-[11px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                    11 pt
                  </span>
                </button>

                {/* Body Text */}
                <button
                  type="button"
                  onClick={() => handleAddText("body")}
                  className="w-full py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-purple-50/70 hover:border-purple-300 transition-all text-left flex items-center justify-between cursor-pointer group shadow-2xs"
                >
                  <span className="text-xs text-slate-600">Add body text</span>
                  <span className="text-[11px] font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                    8.5 pt
                  </span>
                </button>
              </div>

              {/* Quick Preset Review CTAs */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-bold text-slate-700">Popular Review CTAs</p>
                <div className="space-y-1.5">
                  {[
                    "Review Us On Google",
                    "Tap Phone or Scan QR",
                    "How Was Your Experience?",
                    "Loved Your Visit? Review Us",
                    "Rate Us 5 Stars On Google",
                    "POINT CAMERA OR TAP PHONE HERE",
                  ].map((cta) => (
                    <button
                      key={cta}
                      type="button"
                      onClick={() => handleAddText("headline", cta)}
                      className="w-full py-2 px-3 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-purple-300 transition-all text-left text-xs font-medium text-slate-700 cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">{cta}</span>
                      <Plus className="h-3 w-3 text-purple-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOADS & BUSINESS LOGO */}
          {activeDrawerTab === "uploads" && (
            <div className="space-y-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={onUploadFile}
              />

              {/* Upload Button matching Canva purple */}
              <button
                type="button"
                onClick={() => {
                  if (onUploadClick) onUploadClick();
                  else fileInputRef.current?.click();
                }}
                className="w-full py-3 px-4 rounded-xl bg-[#7d2ae8] hover:bg-[#6b21a8] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                Upload files
              </button>

              {/* Uploaded Custom Artwork Card */}
              {customDesign && (
                <div className="rounded-xl border border-slate-200 p-2.5 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-12 w-9 rounded-md bg-cover bg-center border border-slate-300 shadow-2xs shrink-0"
                      style={{ backgroundImage: `url(${customDesign})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {customDesignName || "Custom Card Background"}
                      </p>
                      <p className="text-[10px] text-slate-500">A6 105 × 148 mm Artwork</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
                    >
                      Replace
                    </button>
                    <span className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={onRemoveUpload}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center gap-0.5"
                    >
                      <Trash2 className="h-3 w-3 inline" /> Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Business Logo Section */}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-bold text-slate-700">Business Logo</p>
                {logoUrl ? (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white">
                    <div className="h-12 w-12 rounded-full border border-slate-200 overflow-hidden flex items-center justify-center bg-white shadow-xs shrink-0">
                      <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {businessName || "Your Logo"}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const newId = `elem-logo-${Date.now().toString(36)}`;
                          const next = [
                            ...elements,
                            {
                              id: newId,
                              type: "logo" as CanvasElementType,
                              x: 10,
                              y: 10,
                              width: 16,
                              height: 16,
                              src: logoUrl,
                            },
                          ];
                          updateElements(next);
                          pushHistory(next);
                          setSelectedId(newId);
                        }}
                        className="mt-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 cursor-pointer"
                      >
                        + Insert Logo on Card
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    No logo uploaded yet. Upload one from Settings or use the button above.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TEMPLATES / CARD STYLES */}
          {activeDrawerTab === "templates" && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">1-Click Theme Presets</p>
              <div className="space-y-2">
                {TEMPLATE_PRESETS.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      if (onColorChange) onColorChange(tpl.color);
                      if (onApplyPreset) onApplyPreset(tpl);
                      const isLight = isLightColor(tpl.color);
                      const newTextFill = isLight ? "#0f172a" : "#ffffff";
                      const newSubFill = isLight ? "#475569" : "rgba(255, 255, 255, 0.90)";
                      const next = elements.map((e) => {
                        if (e.id === "elem-cta-headline") {
                          return { ...e, text: tpl.headline, fill: newTextFill };
                        }
                        if (e.id === "elem-biz-name") {
                          return { ...e, fill: newTextFill };
                        }
                        if (e.id === "elem-biz-cat" || e.id === "elem-footer-note") {
                          return { ...e, fill: newSubFill };
                        }
                        if (e.id === "elem-sticker-nfc") {
                          return {
                            ...e,
                            stickerType: isLight ? ("nfc" as const) : ("nfcWhite" as const),
                            src: isLight ? STICKER_SVGS.nfc : STICKER_SVGS.nfcWhite,
                          };
                        }
                        return e;
                      });
                      updateElements(next);
                      pushHistory(next);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      cardColor.toLowerCase() === tpl.color.toLowerCase()
                        ? "border-purple-600 bg-purple-50/70 shadow-xs"
                        : "border-slate-200 bg-white hover:border-purple-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg shadow-xs border border-white/20"
                        style={{ backgroundColor: tpl.color }}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{tpl.name}</p>
                        <p className="text-[10px] text-slate-500">{tpl.tag}</p>
                      </div>
                    </div>
                    {cardColor.toLowerCase() === tpl.color.toLowerCase() && (
                      <Check className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BACKGROUND COLOR */}
          {activeDrawerTab === "background" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Preset Theme Colors</p>
                <div className="grid grid-cols-5 gap-2">
                  {CANVA_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onColorChange && onColorChange(c)}
                      style={{ backgroundColor: c }}
                      className={`h-9 w-full rounded-xl border border-slate-300 transition-transform hover:scale-105 ${
                        cardColor.toLowerCase() === c.toLowerCase()
                          ? "ring-2 ring-purple-600 ring-offset-2"
                          : ""
                      }`}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-bold text-slate-700">Custom Color</p>
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 rounded-xl overflow-hidden border border-slate-300 shadow-xs shrink-0 cursor-pointer">
                    <div className="absolute inset-0" style={{ backgroundColor: cardColor }} />
                    <input
                      type="color"
                      value={
                        cardColor.startsWith("#") && cardColor.length === 7 ? cardColor : "#1a73e8"
                      }
                      onChange={(e) => onColorChange && onColorChange(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <input
                    type="text"
                    value={cardColor}
                    onChange={(e) => onColorChange && onColorChange(e.target.value)}
                    className="flex-1 h-10 px-3 font-mono text-xs border rounded-xl bg-slate-50 uppercase font-semibold"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- 3. CENTER WORKSPACE (LIGHT MODE CANVA CANVAS) ---------------- */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#f1f3f5] relative overflow-hidden">
        {/* Floating Collapse Drawer Re-open Tab (if drawer collapsed) */}
        {!isDrawerOpen && (
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="absolute left-3 top-3 z-30 p-2 rounded-xl bg-white border border-slate-200/90 shadow-md text-slate-600 hover:text-slate-900 cursor-pointer"
            title="Open Drawer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* ---------------- CANVA TOP DOCKED PROPERTY BAR (IMAGE 3) ---------------- */}
        <div className="shrink-0 px-4 pt-3 pb-1 flex justify-center z-30">
          <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-sm rounded-2xl px-3 py-1.5 flex items-center gap-2 text-slate-800 text-xs max-w-full overflow-x-auto">
          {selectedElement?.type === "text" ? (
            <>
              {/* Font Family selector pill (with 140+ Google Fonts Popover) */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowFontPicker(!showFontPicker)}
                  className="h-8 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer max-w-[155px]"
                  title="Choose from 140+ Google Fonts"
                >
                  <Type className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                  <span className="truncate">
                    {selectedElement.fontFamily?.split(",")[0]?.replace(/['"]/g, "") || "Open Sans"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 ml-auto" />
                </button>

                {/* 140+ Google Fonts Dropdown Popover */}
                {showFontPicker && (
                  <div className="absolute top-10 left-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 flex flex-col gap-2.5 animate-scale-in">
                    <div className="flex items-center justify-between pb-1 border-b">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <Type className="h-3.5 w-3.5 text-purple-600" />
                        Google Fonts ({CANVA_FONTS.length}+)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowFontPicker(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={fontSearch}
                        onChange={(e) => setFontSearch(e.target.value)}
                        placeholder="Search 140+ fonts..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                        autoFocus
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-semibold">
                      {(
                        [
                          { id: "all", label: "All" },
                          { id: "sans", label: "Sans" },
                          { id: "serif", label: "Serif" },
                          { id: "display", label: "Display" },
                          { id: "handwriting", label: "Script" },
                          { id: "mono", label: "Mono" },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFontCategory(tab.id)}
                          className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                            fontCategory === tab.id
                              ? "bg-purple-600 text-white font-bold"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Font List */}
                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                      {filteredFonts.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">No fonts found</p>
                      ) : (
                        filteredFonts.map((f) => {
                          const isSelected =
                            selectedElement.fontFamily?.toLowerCase() === f.value.toLowerCase() ||
                            selectedElement.fontFamily
                              ?.split(",")[0]
                              ?.trim()
                              ?.replace(/['"]/g, "")
                              ?.toLowerCase() === f.name.toLowerCase();
                          return (
                            <button
                              key={f.name}
                              type="button"
                              onMouseEnter={() => loadGoogleFont(f.value)}
                              onClick={() => {
                                loadGoogleFont(f.value);
                                updateSelectedElement({ fontFamily: f.value });
                                setShowFontPicker(false);
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-purple-50 text-purple-700 font-bold border border-purple-200"
                                  : "hover:bg-slate-50 text-slate-800"
                              }`}
                            >
                              <span style={{ fontFamily: f.value }} className="text-sm truncate">
                                {f.name}
                              </span>
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-mono">
                                  {f.category}
                                </span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-purple-600" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-5 w-px bg-slate-200 shrink-0" />

              {/* Font Size Stepper (like Image 3 "- 12 +") */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-8 px-1 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    updateSelectedElement({
                      fontSize: Math.max(7, (selectedElement.fontSize || 12) - 1),
                    })
                  }
                  className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                  title="Decrease font size"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-7 text-center font-mono text-xs font-bold text-slate-800">
                  {selectedElement.fontSize || 12}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateSelectedElement({
                      fontSize: Math.min(48, (selectedElement.fontSize || 12) + 1),
                    })
                  }
                  className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                  title="Increase font size"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <div className="h-5 w-px bg-slate-200 shrink-0" />

              {/* Text Color button 'A' with color indicator bar & click-to-open popover */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTextColorPicker(!showTextColorPicker)}
                  className="h-8 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex flex-col items-center justify-center gap-0.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500"
                  title="Change Text Color"
                >
                  <div className="flex items-center gap-1">
                    <span className="font-serif font-black text-xs text-slate-800 leading-none">
                      A
                    </span>
                    <ChevronDown className="h-2.5 w-2.5 text-slate-400" />
                  </div>
                  <span
                    className="h-1 w-6 rounded-full border border-black/10"
                    style={{ backgroundColor: selectedElement.fill || "#0f172a" }}
                  />
                </button>

                {/* Color Palette Popover */}
                {showTextColorPicker && (
                  <div className="absolute top-10 left-0 p-3 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col gap-2.5 w-56 animate-scale-in">
                    <div className="flex items-center justify-between pb-1 border-b">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Palette className="h-3.5 w-3.5 text-purple-600" /> Text Color
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTextColorPicker(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        "#000000",
                        "#ffffff",
                        "#1a73e8",
                        "#1e293b",
                        "#065f46",
                        "#d97706",
                        "#dc2626",
                        "#4338ca",
                        "#7c3aed",
                        "#64748b",
                      ].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            updateSelectedElement({ fill: c });
                            setShowTextColorPicker(false);
                          }}
                          style={{ backgroundColor: c }}
                          className={`h-7 w-7 rounded-lg border border-slate-300 transition-all hover:scale-110 cursor-pointer ${
                            selectedElement.fill?.toLowerCase() === c.toLowerCase()
                              ? "ring-2 ring-purple-600 scale-105"
                              : ""
                          }`}
                          title={c}
                        />
                      ))}
                    </div>

                    <div className="pt-2 border-t flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Custom Hex Color
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-slate-300 shrink-0">
                          <div
                            className="absolute inset-0"
                            style={{ backgroundColor: selectedElement.fill || "#0f172a" }}
                          />
                          <input
                            type="color"
                            value={
                              selectedElement.fill?.startsWith("#") && selectedElement.fill.length === 7
                                ? selectedElement.fill
                                : "#0f172a"
                            }
                            onChange={(e) => updateSelectedElement({ fill: e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        <input
                          type="text"
                          value={selectedElement.fill || ""}
                          onChange={(e) => updateSelectedElement({ fill: e.target.value })}
                          placeholder="#000000"
                          className="flex-1 h-8 px-2.5 font-mono text-xs border border-slate-200 rounded-lg bg-slate-50 uppercase font-semibold"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bold 'B' Toggle */}
              <button
                type="button"
                onClick={() =>
                  updateSelectedElement({
                    fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  selectedElement.fontWeight === "bold"
                    ? "bg-purple-100 text-purple-700 font-bold border border-purple-300"
                    : "text-slate-600 hover:bg-slate-100 border border-transparent"
                }`}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>

              {/* Italic 'I' Toggle */}
              <button
                type="button"
                onClick={() =>
                  updateSelectedElement({
                    fontStyle: selectedElement.fontStyle === "italic" ? "normal" : "italic",
                  })
                }
                className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                  selectedElement.fontStyle === "italic"
                    ? "bg-purple-100 text-purple-700 font-bold border border-purple-300"
                    : "text-slate-600 hover:bg-slate-100 border border-transparent"
                }`}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>

              {/* Alignment Toggle */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 h-8 shrink-0">
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ align: "left" })}
                  className={`h-6 w-6 rounded flex items-center justify-center cursor-pointer ${
                    selectedElement.align === "left"
                      ? "bg-white text-purple-700 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ align: "center" })}
                  className={`h-6 w-6 rounded flex items-center justify-center cursor-pointer ${
                    selectedElement.align === "center" || !selectedElement.align
                      ? "bg-white text-purple-700 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ align: "right" })}
                  className={`h-6 w-6 rounded flex items-center justify-center cursor-pointer ${
                    selectedElement.align === "right"
                      ? "bg-white text-purple-700 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="h-3 w-3" />
                </button>
              </div>

              {/* Direct Inline Edit Button */}
              <button
                type="button"
                onClick={() => setEditingTextId(selectedElement.id)}
                className="h-8 px-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                title="Click to edit text directly on card (or double-click text)"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit on Card</span>
              </button>

              {/* Layer Ordering Buttons */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 h-8 shrink-0">
                <button
                  type="button"
                  onClick={() => moveLayer("down")}
                  className="h-6 w-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                  title="Send Backward ([)"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveLayer("up")}
                  className="h-6 w-6 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 cursor-pointer"
                  title="Bring Forward (])"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
              </div>
            </>
          ) : selectedElement?.type === "panel" ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-slate-700 text-xs">Center Review Card Panel</span>
              <span className="text-[11px] font-mono text-purple-600">
                {selectedElement.width} × {selectedElement.height} mm
              </span>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ fill: "#ffffff" })}
                  className="px-2 py-0.5 rounded-lg border text-[11px] bg-white font-semibold cursor-pointer"
                >
                  White
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ fill: "#f8fafc" })}
                  className="px-2 py-0.5 rounded-lg border text-[11px] bg-slate-50 font-semibold cursor-pointer"
                >
                  Light Gray
                </button>
              </div>
            </div>
          ) : selectedElement?.type === "qr" ? (
            <>
              <span className="font-semibold text-slate-700 text-xs flex items-center gap-1.5 shrink-0">
                <QrCode className="h-4 w-4 text-purple-600" /> QR Code Frame:
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ qrFrame: "white" })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedElement.qrFrame === "white"
                      ? "bg-purple-100 text-purple-700 border border-purple-300 font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  White Box
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ qrFrame: "none" })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedElement.qrFrame === "none"
                      ? "bg-purple-100 text-purple-700 border border-purple-300 font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Transparent
                </button>
                <button
                  type="button"
                  onClick={() => updateSelectedElement({ qrFrame: "dark" })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    selectedElement.qrFrame === "dark"
                      ? "bg-purple-100 text-purple-700 border border-purple-300 font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Dark Box
                </button>
              </div>
              <span className="text-[11px] font-mono text-purple-600 ml-1 shrink-0">
                {selectedElement.width} × {selectedElement.height} mm
              </span>
            </>
          ) : selectedElement?.type === "sticker" ? (
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold text-slate-700 text-xs">
                {selectedElement.stickerType?.startsWith("nfc")
                  ? "Contactless NFC Logo"
                  : selectedElement.stickerType === "google"
                    ? "Official Google 'G' Logo"
                    : selectedElement.stickerType === "googleBadge"
                      ? "Google Reviews Badge"
                      : selectedElement.stickerType === "star5"
                        ? "5-Star Rating Badge"
                        : "Sticker Badge"}
              </span>
              {selectedElement.stickerType?.startsWith("nfc") && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedElement({
                        stickerType: "nfcColor",
                        src: STICKER_SVGS.nfcColor,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      selectedElement.stickerType === "nfcColor"
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    🌈 Multicolor
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedElement({
                        stickerType: "nfc",
                        src: STICKER_SVGS.nfc,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      selectedElement.stickerType === "nfc"
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    Badge
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedElement({
                        stickerType: "nfcWhite",
                        src: STICKER_SVGS.nfcWhite,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      selectedElement.stickerType === "nfcWhite"
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    White
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateSelectedElement({
                        stickerType: "nfcDark",
                        src: STICKER_SVGS.nfcDark,
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer ${
                      selectedElement.stickerType === "nfcDark"
                        ? "bg-purple-600 text-white shadow-2xs"
                        : "text-slate-600 hover:bg-white"
                    }`}
                  >
                    Dark
                  </button>
                </div>
              )}
              <span className="text-[11px] font-mono text-slate-400">
                {selectedElement.width} × {selectedElement.height} mm
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 shrink-0">
              <Layers className="h-3.5 w-3.5 text-purple-600" />
              <span className="font-semibold text-slate-700 text-xs">
                Canva A6 Card Studio · 105 × 148 mm
              </span>
            </div>
          )}

          {/* Angle Rotation Controller for any selected element */}
          {selectedElement && (
            <div className="flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-0.5 ml-1">
              <button
                type="button"
                onClick={() => {
                  const cur = selectedElement.rotation || 0;
                  const nextRot = (cur - 15 + 360) % 360;
                  updateSelectedElement({ rotation: nextRot });
                  const node = nodeRefs.current.get(selectedElement.id);
                  if (node) {
                    node.rotation(nextRot);
                    transformerRef.current?.getLayer()?.batchDraw();
                  }
                }}
                className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-purple-700 transition-colors cursor-pointer"
                title="Rotate -15°"
              >
                <RotateCcw className="h-3 w-3" />
              </button>

              <div className="flex items-center gap-0.5">
                <input
                  type="number"
                  value={selectedElement.rotation || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    const nextRot = ((val % 360) + 360) % 360;
                    updateSelectedElement({ rotation: nextRot });
                    const node = nodeRefs.current.get(selectedElement.id);
                    if (node) {
                      node.rotation(nextRot);
                      transformerRef.current?.getLayer()?.batchDraw();
                    }
                  }}
                  className="w-8 text-center font-mono text-xs font-bold text-slate-800 bg-transparent focus:outline-none"
                  title="Angle in degrees (0 - 360°)"
                />
                <span className="text-[10px] font-bold text-slate-400">°</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const cur = selectedElement.rotation || 0;
                  const nextRot = (cur + 15) % 360;
                  updateSelectedElement({ rotation: nextRot });
                  const node = nodeRefs.current.get(selectedElement.id);
                  if (node) {
                    node.rotation(nextRot);
                    transformerRef.current?.getLayer()?.batchDraw();
                  }
                }}
                className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:bg-white hover:text-purple-700 transition-colors cursor-pointer"
                title="Rotate +15°"
              >
                <RotateCw className="h-3 w-3" />
              </button>

              {/* Quick rotation presets */}
              <div className="flex items-center gap-0.5 ml-0.5 pl-1 border-l border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    updateSelectedElement({ rotation: 0 });
                    const node = nodeRefs.current.get(selectedElement.id);
                    if (node) {
                      node.rotation(0);
                      transformerRef.current?.getLayer()?.batchDraw();
                    }
                  }}
                  className="px-1 text-[10px] font-bold rounded hover:bg-white text-slate-500 hover:text-slate-900 cursor-pointer"
                  title="Reset rotation to 0°"
                >
                  0°
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSelectedElement({ rotation: 90 });
                    const node = nodeRefs.current.get(selectedElement.id);
                    if (node) {
                      node.rotation(90);
                      transformerRef.current?.getLayer()?.batchDraw();
                    }
                  }}
                  className="px-1 text-[10px] font-bold rounded hover:bg-white text-slate-500 hover:text-slate-900 cursor-pointer"
                  title="Rotate to 90°"
                >
                  90°
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateSelectedElement({ rotation: 180 });
                    const node = nodeRefs.current.get(selectedElement.id);
                    if (node) {
                      node.rotation(180);
                      transformerRef.current?.getLayer()?.batchDraw();
                    }
                  }}
                  className="px-1 text-[10px] font-bold rounded hover:bg-white text-slate-500 hover:text-slate-900 cursor-pointer"
                  title="Rotate to 180°"
                >
                  180°
                </button>
              </div>
            </div>
          )}

          <div className="h-5 w-px bg-slate-200 ml-auto shrink-0" />

          {/* Action Icons: Undo, Redo, Duplicate, Delete */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button>
            {selectedElement && (
              <>
                <button
                  type="button"
                  onClick={handleDuplicateSelected}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Duplicate (Ctrl+D)"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Delete (Delete / Backspace)"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* ---------------- SCROLLABLE CANVAS WORKSPACE (Allows smooth full scrolling) ---------------- */}
        <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 w-full p-6 pb-36 flex flex-col items-center">
          {/* ---------------- FLOATING CARD UTILITY ICONS RIGHT ABOVE CARD (IMAGE 1 & 3) ---------------- */}
          <div
            className="flex items-center justify-end gap-1.5 mb-2 px-1"
            style={{ width: `${A6_WIDTH_PX * zoomScale}px`, maxWidth: "100%" }}
          >
            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isLocked
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
              title={isLocked ? "Unlock Card" : "Lock Card Canvas"}
            >
              {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={handleDuplicateSelected}
              disabled={!selectedElement}
              className="p-1.5 rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              title="Duplicate Selected"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetLayout}
              className="p-1.5 rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 cursor-pointer flex items-center gap-1 text-[11px] font-semibold"
              title="Reset to Default A6 Layout"
            >
              <RotateCcw className="h-3 w-3" /> Reset Default
            </button>
          </div>

          {/* ---------------- INTERACTIVE A6 CARD STAGE (420 x 592 px scaled) ---------------- */}
          <div
            className="relative rounded-2xl shadow-xl border border-slate-300/80 bg-white transition-all focus:outline-none"
            tabIndex={0}
            style={{
              width: `${A6_WIDTH_PX * zoomScale}px`,
              height: `${A6_HEIGHT_PX * zoomScale}px`,
            }}
          >
            <Stage
              ref={stageRef}
              width={A6_WIDTH_PX * zoomScale}
              height={A6_HEIGHT_PX * zoomScale}
              scaleX={zoomScale}
              scaleY={zoomScale}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) {
                  setSelectedId(null);
                  setEditingTextId(null);
                }
              }}
            >
              <Layer>
                {/* 1. Background (Custom Design Artwork or Curated Base Color) */}
                {bgImg ? (
                  <KonvaImage
                    image={bgImg}
                    x={0}
                    y={0}
                    width={A6_WIDTH_PX}
                    height={A6_HEIGHT_PX}
                    cornerRadius={20}
                  />
                ) : (
                  <Rect
                    x={0}
                    y={0}
                    width={A6_WIDTH_PX}
                    height={A6_HEIGHT_PX}
                    fill={cardColor}
                    cornerRadius={20}
                    {...(isLightColor(cardColor) ? { stroke: "#e2e8f0", strokeWidth: 1.5 } : {})}
                  />
                )}

                {/* 2. Safe Print Guideline (4mm interior boundary) */}
                {showMarginGuides && (
                  <Rect
                    x={SAFE_MARGIN_PX}
                    y={SAFE_MARGIN_PX}
                    width={A6_WIDTH_PX - SAFE_MARGIN_PX * 2}
                    height={A6_HEIGHT_PX - SAFE_MARGIN_PX * 2}
                    stroke={
                      isLightColor(cardColor)
                        ? "rgba(100, 116, 139, 0.35)"
                        : "rgba(255, 255, 255, 0.3)"
                    }
                    strokeWidth={1}
                    dash={[5, 4]}
                    listening={false}
                  />
                )}

                {/* 3. Magnetic Alignment Guiding Lines */}
                {activeGuides.map((g, idx) =>
                  g.orientation === "V" ? (
                    <Line
                      key={`guide-v-${idx}`}
                      points={[g.pos, 0, g.pos, A6_HEIGHT_PX]}
                      stroke={g.color || "#8b3dff"}
                      strokeWidth={1.5}
                      dash={[4, 3]}
                      listening={false}
                    />
                  ) : (
                    <Line
                      key={`guide-h-${idx}`}
                      points={[0, g.pos, A6_WIDTH_PX, g.pos]}
                      stroke={g.color || "#8b3dff"}
                      strokeWidth={1.5}
                      dash={[4, 3]}
                      listening={false}
                    />
                  ),
                )}

              {/* 4. Canvas Elements Render Loop */}
              {elements.map((elem) => {
                const xPx = elem.x * MM_TO_PX;
                const yPx = elem.y * MM_TO_PX;
                const widthPx = elem.width * MM_TO_PX;
                const heightPx = elem.height * MM_TO_PX;

                if (elem.type === "text") {
                  return (
                    <KonvaText
                      key={elem.id}
                      ref={(node) => {
                        if (node) nodeRefs.current.set(elem.id, node);
                        else nodeRefs.current.delete(elem.id);
                      }}
                      id={elem.id}
                      x={xPx}
                      y={yPx}
                      width={widthPx}
                      text={elem.text || ""}
                      fontSize={(elem.fontSize || 12) * 1.33}
                      fontFamily={elem.fontFamily || "Inter, sans-serif"}
                      fontStyle={
                        elem.fontWeight === "bold"
                          ? elem.fontStyle === "italic"
                            ? "bold italic"
                            : "bold"
                          : elem.fontStyle === "italic"
                            ? "italic"
                            : "normal"
                      }
                      fill={elem.fill || "#ffffff"}
                      align={elem.align || "center"}
                      rotation={elem.rotation || 0}
                      opacity={editingTextId === elem.id ? 0 : 1}
                      draggable={!isLocked}
                      onClick={() => setSelectedId(elem.id)}
                      onTap={() => setSelectedId(elem.id)}
                      onDblClick={() => setEditingTextId(elem.id)}
                      onDblTap={() => setEditingTextId(elem.id)}
                      onDragMove={(e) => handleDragMove(elem.id, e)}
                      onDragEnd={(e) => handleDragEnd(elem.id, e)}
                      onTransformEnd={() => handleTransformEnd(elem.id)}
                    />
                  );
                }

                if (elem.type === "panel") {
                  return (
                    <Rect
                      key={elem.id}
                      ref={(node) => {
                        if (node) nodeRefs.current.set(elem.id, node);
                        else nodeRefs.current.delete(elem.id);
                      }}
                      id={elem.id}
                      x={xPx}
                      y={yPx}
                      width={widthPx}
                      height={heightPx}
                      fill={elem.fill || "#ffffff"}
                      cornerRadius={(elem.cornerRadius || 4.5) * MM_TO_PX}
                      {...(elem.stroke ? { stroke: elem.stroke, strokeWidth: 1 } : {})}
                      shadowColor="rgba(0, 0, 0, 0.08)"
                      shadowBlur={12}
                      shadowOffsetY={3}
                      rotation={elem.rotation || 0}
                      draggable={!isLocked}
                      onClick={() => setSelectedId(elem.id)}
                      onTap={() => setSelectedId(elem.id)}
                      onDragMove={(e) => handleDragMove(elem.id, e)}
                      onDragEnd={(e) => handleDragEnd(elem.id, e)}
                      onTransformEnd={() => handleTransformEnd(elem.id)}
                    />
                  );
                }

                if (elem.type === "qr") {
                  const framePadding = elem.qrFrame === "white" ? 2 * MM_TO_PX : 0;
                  return (
                    <Group
                      key={elem.id}
                      ref={(node) => {
                        if (node) nodeRefs.current.set(elem.id, node);
                        else nodeRefs.current.delete(elem.id);
                      }}
                      id={elem.id}
                      x={xPx}
                      y={yPx}
                      width={widthPx}
                      height={heightPx}
                      rotation={elem.rotation || 0}
                      draggable={!isLocked}
                      onClick={() => setSelectedId(elem.id)}
                      onTap={() => setSelectedId(elem.id)}
                      onDragMove={(e) => handleDragMove(elem.id, e)}
                      onDragEnd={(e) => handleDragEnd(elem.id, e)}
                      onTransformEnd={() => handleTransformEnd(elem.id)}
                    >
                      {/* Frame Panel */}
                      {elem.qrFrame !== "none" && (
                        <Rect
                          x={0}
                          y={0}
                          width={widthPx}
                          height={heightPx}
                          fill={elem.qrFrame === "white" ? "#ffffff" : "#0f172a"}
                          cornerRadius={10}
                          shadowColor="rgba(0, 0, 0, 0.22)"
                          shadowBlur={10}
                          shadowOffsetY={4}
                        />
                      )}
                      {/* Crisp QR Code Image */}
                      {qrImg ? (
                        <KonvaImage
                          image={qrImg}
                          x={framePadding}
                          y={framePadding}
                          width={widthPx - framePadding * 2}
                          height={heightPx - framePadding * 2}
                        />
                      ) : (
                        <Rect
                          x={framePadding}
                          y={framePadding}
                          width={widthPx - framePadding * 2}
                          height={heightPx - framePadding * 2}
                          fill="#ffffff"
                        />
                      )}
                    </Group>
                  );
                }

                if (elem.type === "logo") {
                  return (
                    <Group
                      key={elem.id}
                      ref={(node) => {
                        if (node) nodeRefs.current.set(elem.id, node);
                        else nodeRefs.current.delete(elem.id);
                      }}
                      id={elem.id}
                      x={xPx}
                      y={yPx}
                      width={widthPx}
                      height={heightPx}
                      rotation={elem.rotation || 0}
                      draggable={!isLocked}
                      onClick={() => setSelectedId(elem.id)}
                      onTap={() => setSelectedId(elem.id)}
                      onDragMove={(e) => handleDragMove(elem.id, e)}
                      onDragEnd={(e) => handleDragEnd(elem.id, e)}
                      onTransformEnd={() => handleTransformEnd(elem.id)}
                    >
                      {/* Logo background circle */}
                      <Rect
                        x={0}
                        y={0}
                        width={widthPx}
                        height={heightPx}
                        fill="#ffffff"
                        cornerRadius={widthPx / 2}
                        shadowColor="rgba(0, 0, 0, 0.2)"
                        shadowBlur={6}
                        shadowOffsetY={2}
                      />
                      {logoImg ? (
                        <KonvaImage
                          image={logoImg}
                          x={0}
                          y={0}
                          width={widthPx}
                          height={heightPx}
                          cornerRadius={widthPx / 2}
                        />
                      ) : (
                        <KonvaText
                          x={0}
                          y={heightPx * 0.25}
                          width={widthPx}
                          text={businessName?.slice(0, 2).toUpperCase() || "RC"}
                          fontSize={heightPx * 0.45}
                          fontFamily="Plus Jakarta Sans, sans-serif"
                          fontStyle="bold"
                          fill={cardColor || "#1a73e8"}
                          align="center"
                        />
                      )}
                    </Group>
                  );
                }

                if (elem.type === "sticker") {
                  const stickerKey = elem.stickerType || "google";
                  const sImg = stickerImages[stickerKey];

                  return (
                    <Group
                      key={elem.id}
                      ref={(node) => {
                        if (node) nodeRefs.current.set(elem.id, node);
                        else nodeRefs.current.delete(elem.id);
                      }}
                      id={elem.id}
                      x={xPx}
                      y={yPx}
                      width={widthPx}
                      height={heightPx}
                      rotation={elem.rotation || 0}
                      draggable={!isLocked}
                      onClick={() => setSelectedId(elem.id)}
                      onTap={() => setSelectedId(elem.id)}
                      onDragMove={(e) => handleDragMove(elem.id, e)}
                      onDragEnd={(e) => handleDragEnd(elem.id, e)}
                      onTransformEnd={() => handleTransformEnd(elem.id)}
                    >
                      {sImg && (
                        <KonvaImage
                          image={sImg}
                          x={0}
                          y={0}
                          width={widthPx}
                          height={heightPx}
                          shadowColor="rgba(0,0,0,0.14)"
                          shadowBlur={4}
                          shadowOffsetY={1}
                        />
                      )}
                    </Group>
                  );
                }

                return null;
              })}

              {/* 5. Blue/Purple Canva Transformer Bounding Box with Height & Width Drag Anchors */}
              <Transformer
                ref={transformerRef}
                borderStroke="#8b3dff"
                borderStrokeWidth={2}
                anchorStroke="#8b3dff"
                anchorFill="#ffffff"
                anchorSize={8}
                anchorCornerRadius={2}
                rotateAnchorOffset={24}
                rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                rotationSnapTolerance={5}
                enabledAnchors={[
                  "top-left",
                  "top-center",
                  "top-right",
                  "middle-left",
                  "middle-right",
                  "bottom-left",
                  "bottom-center",
                  "bottom-right",
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 10 || newBox.height < 10) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            </Layer>
          </Stage>

          {/* 6. Direct On-Canvas Inline Text Editing Overlay (Double-click or press Enter to edit right here) */}
          {(() => {
            const editingElem = elements.find((e) => e.id === editingTextId);
            if (!editingElem || editingElem.type !== "text") return null;

            return (
              <textarea
                key={editingElem.id}
                autoFocus
                defaultValue={editingElem.text || ""}
                style={{
                  position: "absolute",
                  left: `${editingElem.x * MM_TO_PX * zoomScale}px`,
                  top: `${editingElem.y * MM_TO_PX * zoomScale}px`,
                  width: `${editingElem.width * MM_TO_PX * zoomScale}px`,
                  minHeight: `${(editingElem.height || 7) * MM_TO_PX * zoomScale}px`,
                  fontSize: `${(editingElem.fontSize || 12) * 1.33 * zoomScale}px`,
                  fontFamily: editingElem.fontFamily || "Inter, sans-serif",
                  fontWeight: editingElem.fontWeight === "bold" ? 700 : 400,
                  fontStyle: editingElem.fontStyle === "italic" ? "italic" : "normal",
                  color: editingElem.fill || "#ffffff",
                  textAlign: editingElem.align || "center",
                  lineHeight: 1.25,
                  transform: editingElem.rotation
                    ? `rotate(${editingElem.rotation}deg)`
                    : undefined,
                  transformOrigin: "0 0",
                  background: isLightColor(cardColor)
                    ? "rgba(255, 255, 255, 0.96)"
                    : "rgba(15, 23, 42, 0.94)",
                  border: "2px solid #8b3dff",
                  boxShadow: "0 4px 18px rgba(139, 61, 255, 0.35)",
                  borderRadius: "6px",
                  padding: "2px 4px",
                  outline: "none",
                  resize: "none",
                  overflow: "hidden",
                  zIndex: 50,
                  boxSizing: "border-box",
                }}
                ref={(el) => {
                  if (el) {
                    el.focus();
                    el.select();
                    el.style.height = "auto";
                    el.style.height = `${el.scrollHeight}px`;
                  }
                }}
                onInput={(e) => {
                  const target = e.currentTarget;
                  target.style.height = "auto";
                  target.style.height = `${target.scrollHeight}px`;
                  const newHeightMm = Math.max(
                    editingElem.height,
                    Number((target.scrollHeight / (MM_TO_PX * zoomScale)).toFixed(1)),
                  );
                  updateSelectedElement({
                    text: target.value,
                    height: newHeightMm,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setEditingTextId(null);
                  } else if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    setEditingTextId(null);
                  }
                }}
                onBlur={() => setEditingTextId(null)}
              />
            );
          })()}
        </div>

        </div>
      </div>

      {/* ---------------- 4. BOTTOM DOCKED CANVA STATUS BAR ---------------- */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
        <div className="pointer-events-auto py-1 px-3 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-lg flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <span>A6 Card · 105 × 148 mm</span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Toggle Margin Guides */}
          <button
            type="button"
            onClick={() => setShowMarginGuides(!showMarginGuides)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
              showMarginGuides ? "bg-purple-100 text-purple-700" : "text-slate-500 hover:bg-slate-100"
            }`}
            title="Toggle print safe margins and guiding lines"
          >
            Guides: {showMarginGuides ? "ON" : "OFF"}
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))))}
              className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="text-xs font-mono font-semibold text-slate-700 w-10 text-center">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.min(1.5, Number((s + 0.1).toFixed(2))))}
              className="h-6 w-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1)}
              className="text-[10px] px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer ml-1"
            >
              100%
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Shortcuts Helper Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-900">Canva Keyboard Shortcuts</h4>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600 max-h-[60vh] overflow-y-auto pr-1">
              <div className="flex justify-between py-1 border-b">
                <span>Copy element:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Ctrl + C
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Paste element:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Ctrl + V
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Duplicate element:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Ctrl + D
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Edit text on card:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Dbl Click / Enter
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Bold / Italic:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Ctrl + B / Ctrl + I
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Nudge (1 mm):</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Arrow keys
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Fast nudge (5 mm):</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Shift + Arrows
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Send back / Bring forward:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  [ / ]
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Zoom in / out / reset:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Ctrl + / - / 0
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Undo / Redo:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Ctrl + Z / Ctrl + Y
                </kbd>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span>Delete element:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Delete / Backspace
                </kbd>
              </div>
              <div className="flex justify-between py-1">
                <span>Exit edit / Deselect:</span>
                <kbd className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border text-[11px]">
                  Escape
                </kbd>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
