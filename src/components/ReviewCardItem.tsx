import React, { useMemo } from "react";

// Official Contactless NFC Broadcast Wave SVG Icon (Real contactless wave specification, 100% transparent background)
export function ContactlessNfcIcon({
  size = 24,
  className = "",
  style,
  variant = "currentColor",
}: {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  variant?: "currentColor" | "color" | "white" | "dark" | "auto";
}) {
  if (variant === "color") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2.3"
        strokeLinecap="round"
        className={className}
        style={{ flexShrink: 0, ...style }}
      >
        <path d="M5.5 9.4 A 3.2 3.2 0 0 1 5.5 14.6" stroke="#4285F4" />
        <path d="M9.2 7.2 A 6.2 6.2 0 0 1 9.2 16.8" stroke="#EA4335" />
        <path d="M13.0 5.0 A 9.5 9.5 0 0 1 13.0 19.0" stroke="#FBBC05" />
        <path d="M16.8 2.8 A 13.0 13.0 0 0 1 16.8 21.2" stroke="#34A853" />
      </svg>
    );
  }

  const strokeColor =
    variant === "white" ? "#ffffff" : variant === "dark" ? "#0f172a" : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={strokeColor}
      strokeWidth="2.3"
      strokeLinecap="round"
      className={className}
      style={{ flexShrink: 0, ...style }}
    >
      <path d="M5.5 9.4 A 3.2 3.2 0 0 1 5.5 14.6" />
      <path d="M9.2 7.2 A 6.2 6.2 0 0 1 9.2 16.8" />
      <path d="M13.0 5.0 A 9.5 9.5 0 0 1 13.0 19.0" />
      <path d="M16.8 2.8 A 13.0 13.0 0 0 1 16.8 21.2" />
    </svg>
  );
}

import type { CanvasElement } from "./CardCanvaEditor";
import { STICKER_SVGS } from "./CardCanvaEditor";

export interface ReviewCardItemProps {
  name: string;
  category: string;
  color: string;
  qrDotColor?: string | undefined;
  qrBgColor?: string | undefined;
  headline: string;
  url?: string | undefined;
  qr: string;
  logo?: string | null | undefined;
  initials: string;
  includeStars: boolean;
  includeNfc: boolean;
  nfcStyle?: "auto" | "color" | "white" | "dark" | undefined;
  isUniversal?: boolean | undefined;
  universalBadge?: "google" | "star" | "nfc" | "heart" | undefined;
  headerTitle?: string | undefined;
  headerSubtitle?: string | undefined;
  cardId?: string | undefined;
  customDesign?: string | null | undefined;
  qrX?: number | undefined;
  qrY?: number | undefined;
  qrSize?: number | undefined;
  qrFrame?: "white" | "none" | "dark" | undefined;
  cardWidth?: number | undefined;
  cardHeight?: number | undefined;
  elements?: CanvasElement[] | undefined;
}

export function ReviewCardItem({
  name,
  category,
  color,
  qrDotColor = "#000000",
  qrBgColor = "#ffffff",
  headline,
  url,
  qr,
  logo,
  initials,
  includeStars,
  includeNfc,
  nfcStyle = "color",
  isUniversal = false,
  universalBadge = "google",
  headerTitle,
  headerSubtitle,
  cardId,
  customDesign,
  qrX,
  qrY,
  qrSize,
  qrFrame = "white",
  cardWidth = 105,
  cardHeight = 148,
  elements,
}: ReviewCardItemProps) {
  const isDarkCard = useMemo(() => {
    const c = (color || "#1a73e8").replace("#", "");
    if (c.length < 6) return true;
    const r = parseInt(c.slice(0, 2), 16);
    const g = parseInt(c.slice(2, 4), 16);
    const b = parseInt(c.slice(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 180;
  }, [color]);

  // If arbitrary canvas elements are supplied from the Canva Studio, render them directly
  if (elements && elements.length > 0) {
    return (
      <div
        style={{
          width: `${cardWidth}mm`,
          height: `${cardHeight}mm`,
          borderRadius: "5mm",
          backgroundColor: color,
          backgroundImage: customDesign ? `url(${customDesign})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxSizing: "border-box",
          overflow: "hidden",
          position: "relative",
        }}
        className="shadow-sm font-sans select-none"
      >
        {elements.map((elem) => {
          if (elem.type === "text") {
            if (
              elem.id === "elem-footer-url" ||
              (elem.text && elem.text.toLowerCase().includes("reviewcard.link"))
            ) {
              return null;
            }
            return (
              <div
                key={elem.id}
                style={{
                  position: "absolute",
                  left: `${elem.x}mm`,
                  top: `${elem.y}mm`,
                  width: `${elem.width}mm`,
                  fontFamily: elem.fontFamily || "Inter, sans-serif",
                  fontSize: `${(elem.fontSize || 12) * 0.95}pt`,
                  fontWeight: elem.fontWeight === "bold" ? 700 : 400,
                  fontStyle: elem.fontStyle === "italic" ? "italic" : "normal",
                  color: elem.fill || "#ffffff",
                  textAlign: elem.align || "center",
                  lineHeight: 1.25,
                  transform: elem.rotation ? `rotate(${elem.rotation}deg)` : undefined,
                  transformOrigin: "center center",
                  opacity: elem.opacity !== undefined ? elem.opacity : 1,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {elem.text}
              </div>
            );
          }
          if (elem.type === "qr") {
            const framePadding = elem.qrFrame === "white" ? "1.8mm" : "0";
            return (
              <div
                key={elem.id}
                style={{
                  position: "absolute",
                  left: `${elem.x}mm`,
                  top: `${elem.y}mm`,
                  width: `${elem.width}mm`,
                  height: `${elem.height}mm`,
                  padding: framePadding,
                  backgroundColor:
                    elem.qrFrame === "white"
                      ? "#ffffff"
                      : elem.qrFrame === "dark"
                        ? "#0f172a"
                        : "transparent",
                  borderRadius: elem.qrFrame !== "none" ? "2.5mm" : "0",
                  boxShadow: elem.qrFrame !== "none" ? "0 4px 12px rgba(0,0,0,0.18)" : "none",
                  opacity: elem.opacity !== undefined ? elem.opacity : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                {qr ? (
                  <img
                    src={qr}
                    alt="QR Code"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      imageRendering: "crisp-edges",
                    }}
                  />
                ) : (
                  <div style={{ fontSize: "8pt", color: "#94a3b8" }}>Generating QR…</div>
                )}
              </div>
            );
          }
          if (elem.type === "logo") {
            const logoSrc = elem.src || logo;
            return (
              <div
                key={elem.id}
                style={{
                  position: "absolute",
                  left: `${elem.x}mm`,
                  top: `${elem.y}mm`,
                  width: `${elem.width}mm`,
                  height: `${elem.height}mm`,
                  borderRadius: "50%",
                  backgroundColor: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                  opacity: elem.opacity !== undefined ? elem.opacity : 1,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Logo"
                    style={{ width: "90%", height: "90%", objectFit: "contain" }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "9pt",
                      fontWeight: 800,
                      color: color || "#1a73e8",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {initials || "RC"}
                  </span>
                )}
              </div>
            );
          }
          if (elem.type === "panel") {
            return (
              <div
                key={elem.id}
                style={{
                  position: "absolute",
                  left: `${elem.x}mm`,
                  top: `${elem.y}mm`,
                  width: `${elem.width}mm`,
                  height: `${elem.height}mm`,
                  backgroundColor: elem.fill || "#ffffff",
                  borderRadius: `${elem.cornerRadius || 4.5}mm`,
                  boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
                  border: elem.stroke ? `0.4mm solid ${elem.stroke}` : undefined,
                  opacity: elem.opacity !== undefined ? elem.opacity : 1,
                  boxSizing: "border-box",
                }}
              />
            );
          }
          if (elem.type === "sticker") {
            const stickerSrc =
              elem.src || (elem.stickerType ? STICKER_SVGS[elem.stickerType] : null);
            if (!stickerSrc) return null;
            return (
              <img
                key={elem.id}
                src={stickerSrc}
                alt="Sticker"
                style={{
                  position: "absolute",
                  left: `${elem.x}mm`,
                  top: `${elem.y}mm`,
                  width: `${elem.width}mm`,
                  height: `${elem.height}mm`,
                  objectFit: "contain",
                  opacity: elem.opacity !== undefined ? elem.opacity : 1,
                  transform: elem.rotation ? `rotate(${elem.rotation}deg)` : undefined,
                }}
              />
            );
          }
          if (elem.type === "image") {
            const imgSrc = elem.src;
            if (!imgSrc) return null;
            return (
              <div
                key={elem.id}
                style={{
                  position: "absolute",
                  left: `${elem.x}mm`,
                  top: `${elem.y}mm`,
                  width: `${elem.width}mm`,
                  height: `${elem.height}mm`,
                  transform: elem.rotation ? `rotate(${elem.rotation}deg)` : undefined,
                  transformOrigin: "center center",
                  opacity: elem.opacity !== undefined ? elem.opacity : 1,
                  borderRadius: elem.cornerRadius ? `${elem.cornerRadius}mm` : undefined,
                  border: elem.stroke
                    ? `${elem.strokeWidth || 1}px solid ${elem.stroke}`
                    : undefined,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }}
              >
                <img
                  src={imgSrc}
                  alt="Card Graphic"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: elem.fit || "cover",
                    display: "block",
                  }}
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }
  if (customDesign) {
    const s = qrSize ?? 40;
    const posX = qrX ?? (95 - s) / 2;
    const posY = qrY ?? 68;

    return (
      <div
        style={{
          width: "95mm",
          height: "136mm",
          borderRadius: "5mm",
          backgroundColor: color,
          backgroundImage: `url(${customDesign})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxSizing: "border-box",
          overflow: "hidden",
          position: "relative",
        }}
        className="shadow-sm font-sans select-none"
      >
        <div
          style={{
            position: "absolute",
            left: `${posX}mm`,
            top: `${posY}mm`,
            width: `${s}mm`,
            height: `${s}mm`,
            padding: qrFrame === "white" ? "1.8mm" : "0",
            backgroundColor:
              qrFrame === "white" ? "#ffffff" : qrFrame === "dark" ? "#0f172a" : "transparent",
            borderRadius: qrFrame !== "none" ? "2.5mm" : "0",
            boxShadow: qrFrame !== "none" ? "0 4px 12px rgba(0,0,0,0.18)" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {qr ? (
            <img
              src={qr}
              alt="QR Code"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                imageRendering: "crisp-edges",
              }}
            />
          ) : (
            <div style={{ fontSize: "8pt", color: "#94a3b8" }}>Generating QR…</div>
          )}
        </div>
      </div>
    );
  }

  const cardW = cardWidth ? `${cardWidth}mm` : "95mm";
  const cardH = cardHeight ? `${cardHeight}mm` : "136mm";

  return (
    <div
      style={{
        width: cardW,
        height: cardH,
        borderRadius: "5mm",
        backgroundColor: color,
        color: "#ffffff",
        padding: "5.5mm 5mm",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
      }}
      className="shadow-sm font-sans select-none"
    >
      {/* 1. Header (Logo / Universal Badge + Business Name + Category, matching templet.html) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "3.5mm",
          height: "16mm",
          width: "100%",
        }}
      >
        <div
          style={{
            width: "14mm",
            height: "14mm",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            color: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: "13pt",
            flexShrink: 0,
            overflow: "hidden",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          {isUniversal ? (
            universalBadge === "google" ? (
              <svg style={{ width: "7.5mm", height: "7.5mm" }} viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            ) : universalBadge === "star" ? (
              <svg style={{ width: "7.5mm", height: "7.5mm", fill: "#f59e0b" }} viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ) : universalBadge === "nfc" ? (
              <ContactlessNfcIcon size="7.5mm" variant="color" />
            ) : (
              <svg style={{ width: "7.5mm", height: "7.5mm", fill: "#059669" }} viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )
          ) : logo ? (
            <img src={logo} alt={name} className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div
            style={{
              fontSize: isUniversal
                ? (headerTitle || "").length > 24
                  ? "10pt"
                  : "11.5pt"
                : name.length > 28
                  ? "10pt"
                  : name.length > 18
                    ? "11.5pt"
                    : "13pt",
              fontWeight: 800,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "-0.01em",
            }}
            title={isUniversal ? headerTitle || "REVIEW US ON GOOGLE" : name}
          >
            {isUniversal ? headerTitle || "REVIEW US ON GOOGLE" : name}
          </div>
          <div
            style={{
              fontSize: "7pt",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              opacity: 0.92,
              marginTop: "0.8mm",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {isUniversal
              ? headerSubtitle || "SCAN OR TAP WITH PHONE"
              : category || "LOCAL BUSINESS"}
          </div>
        </div>
      </div>

      {/* 2. White Center Review Panel (matching templet.html proportions) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          color: "#0f172a",
          borderRadius: "4.5mm",
          padding: "3.5mm 3.5mm 3mm 3.5mm",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Google Reviews Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.8mm",
            marginBottom: "1.2mm",
          }}
        >
          <svg style={{ width: "5.2mm", height: "5.2mm", flexShrink: 0 }} viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span
            style={{
              fontSize: "8.5pt",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "#1e293b",
            }}
          >
            Google Reviews
          </span>
        </div>

        {/* 5 Golden Stars */}
        {includeStars && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "1.2mm",
              marginBottom: "2mm",
            }}
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <svg
                key={i}
                style={{ width: "5.2mm", height: "5.2mm", fill: "#f59e0b" }}
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            ))}
          </div>
        )}

        {/* Call-to-action Headline (Space Grotesk 11pt) */}
        <div
          style={{
            fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif",
            fontSize: (headline || "").length > 28 ? "9.5pt" : "11pt",
            fontWeight: 700,
            lineHeight: 1.25,
            color: color === "#ffffff" || color === "#f8fafc" ? "#1a73e8" : color,
            marginBottom: "2mm",
            paddingBottom: "0.5mm",
            letterSpacing: "-0.01em",
            maxWidth: "92%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: (headline || "").length > 28 ? "normal" : "nowrap",
          }}
        >
          {headline}
        </div>

        {/* QR Code Container (44 × 44 mm) */}
        <div
          style={{
            width: "44mm",
            height: "44mm",
            padding: "1.5mm",
            backgroundColor: qrBgColor || "#ffffff",
            borderRadius: "3mm",
            border: "0.4mm solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "2mm",
            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
            boxSizing: "border-box",
          }}
        >
          {qr ? (
            <img
              src={qr}
              alt="QR Code"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                imageRendering: "crisp-edges",
              }}
            />
          ) : (
            <div style={{ fontSize: "8pt", color: "#94a3b8" }}>Generating QR…</div>
          )}
        </div>

        {/* Printed Card ID if present */}
        {cardId && (
          <div
            style={{
              marginTop: "0.8mm",
              fontSize: "6.5pt",
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#64748b",
              textTransform: "uppercase",
            }}
          >
            CARD ID: <span style={{ color: "#0f172a", fontWeight: 800 }}>{cardId}</span>
          </div>
        )}
      </div>

      {/* 3. Bottom NFC Bar with Contactless Waves (Without background circle, centered, matching templet.html) */}
      {includeNfc ? (
        <div
          style={{
            height: "14mm",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "3.5mm",
            padding: "0 2mm",
            marginBottom: "1.5mm",
            width: "100%",
          }}
        >
          <ContactlessNfcIcon
            size="8.5mm"
            variant={
              nfcStyle === "color"
                ? "color"
                : nfcStyle === "white"
                  ? "white"
                  : nfcStyle === "dark"
                    ? "dark"
                    : isDarkCard
                      ? "white"
                      : "dark"
            }
          />
          <div style={{ lineHeight: 1.15, textAlign: "left" }}>
            <div
              style={{
                fontSize: "8.5pt",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: isDarkCard ? "#ffffff" : "#0f172a",
              }}
            >
              Tap Phone on Card
            </div>
            <div
              style={{
                fontSize: "6.8pt",
                opacity: 0.9,
                marginTop: "0.4mm",
                color: isDarkCard ? "#ffffff" : "#334155",
              }}
            >
              Instant NFC review link
            </div>
          </div>
        </div>
      ) : (
        <div style={{ height: "3mm" }} />
      )}
    </div>
  );
}
