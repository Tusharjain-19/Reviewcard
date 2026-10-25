import React from "react";

// Official Contactless NFC Broadcast Wave SVG Icon
export function ContactlessNfcIcon({
  size = 24,
  className = "",
  style,
}: {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M6 8a9 9 0 0 1 0 8" />
      <path d="M10 5a14 14 0 0 1 0 14" />
      <path d="M14 2a19 19 0 0 1 0 20" />
      <path d="M2 11a4 4 0 0 1 0 2" />
    </svg>
  );
}

export interface ReviewCardItemProps {
  name: string;
  category: string;
  color: string;
  qrDotColor?: string;
  qrBgColor?: string;
  headline: string;
  url?: string;
  qr: string;
  logo?: string | null;
  initials: string;
  includeStars: boolean;
  includeNfc: boolean;
  isUniversal?: boolean;
  universalBadge?: "google" | "star" | "nfc" | "heart";
  headerTitle?: string;
  headerSubtitle?: string;
  cardId?: string;
}

export function ReviewCardItem({
  name,
  category,
  color,
  qrDotColor = "#000000",
  qrBgColor = "#ffffff",
  headline,
  qr,
  logo,
  initials,
  includeStars,
  includeNfc,
  isUniversal = false,
  universalBadge = "google",
  headerTitle,
  headerSubtitle,
  cardId,
}: ReviewCardItemProps) {
  return (
    <div
      style={{
        width: "95mm",
        height: "136mm",
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
      {/* 1. Header (Logo / Universal Badge + Title + Subtitle) */}
      <div style={{ display: "flex", alignItems: "center", gap: "3.5mm", height: "16mm" }}>
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
            boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
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
              <ContactlessNfcIcon size="7.5mm" style={{ stroke: color }} />
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: isUniversal ? "11.5pt" : "13pt",
              fontWeight: 800,
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "-0.01em",
            }}
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

      {/* 2. Review Card Panel (White card background with Google badge, stars, QR, headline, and link) */}
      <div
        style={{
          backgroundColor: "#ffffff",
          color: "#0f172a",
          borderRadius: "4.5mm",
          padding: "3.5mm 3.5mm 2.5mm 3.5mm",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          boxShadow: "0 3px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Google Reviews Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.8mm", marginBottom: "1.2mm" }}>
          <svg style={{ width: "5.2mm", height: "5.2mm" }} viewBox="0 0 24 24">
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
          <div style={{ display: "flex", gap: "1.2mm", marginBottom: "1.8mm" }}>
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

        {/* Call-to-action Headline */}
        <div
          style={{
            fontSize: "10.5pt",
            fontWeight: 700,
            lineHeight: 1.2,
            color: color,
            marginBottom: "1.8mm",
          }}
        >
          {headline}
        </div>

        {/* QR Code Container */}
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
          }}
        >
          {qr ? (
            <img
              src={qr}
              alt="QR Code"
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          ) : (
            <div style={{ fontSize: "8pt", color: "#94a3b8" }}>Generating QR…</div>
          )}
        </div>

        {/* Printed Card ID / Code under QR code */}
        {cardId && (
          <div
            style={{
              marginTop: "1.4mm",
              fontSize: "6.8pt",
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#475569",
              textTransform: "uppercase",
            }}
          >
            Card ID: <span style={{ color: "#0f172a", fontWeight: 800 }}>{cardId}</span>
          </div>
        )}
      </div>

      {/* 3. Bottom NFC Bar with Contactless Waves (Horizontally centered & lifted slightly) */}
      {includeNfc ? (
        <div
          style={{
            height: "13mm",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "3.5mm",
            padding: "0 2mm",
            marginBottom: "1mm",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "10mm",
              height: "10mm",
              borderRadius: "50%",
              border: "0.5mm solid rgba(255,255,255,0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ContactlessNfcIcon size="5.8mm" style={{ stroke: "#ffffff" }} />
          </div>
          <div style={{ lineHeight: 1.2, textAlign: "left" }}>
            <div style={{ fontSize: "8.2pt", fontWeight: 700, letterSpacing: "-0.01em" }}>
              Tap Phone on Card
            </div>
            <div style={{ fontSize: "6.5pt", opacity: 0.9 }}>Instant NFC review link</div>
          </div>
        </div>
      ) : (
        <div style={{ height: "3mm" }} />
      )}
    </div>
  );
}
