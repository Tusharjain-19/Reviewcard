import {
  Star,
  MessageCircle,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Globe,
  UtensilsCrossed,
  MapPin,
  Link2,
  Youtube,
  Linkedin,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import {
  buildLinkUrl,
  buttonIds,
  REVIEW_BUTTON_ID,
  reviewUrlFromInput,
  type Business,
  type LinkType,
} from "@/lib/reviewcard";
import { BrandLogo } from "@/components/BrandLogo";

const ICONS: Record<LinkType, typeof Star> = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  x: Link2,
  linkedin: Linkedin,
  website: Globe,
  menu: UtensilsCrossed,
  directions: MapPin,
  custom: Link2,
};
const SHAPE = {
  circle: "rounded-full",
  rounded: "rounded-xl",
  square: "rounded-none",
  rectangle: "rounded-lg",
};
const RADIUS = { rounded: "rounded-xl", pill: "rounded-full", square: "rounded-none" };

/** Public link page. Review button is never gated: it always goes straight to Google. */
export function LinkPage({ b, preview = false }: { b: Business; preview?: boolean }) {
  const [logoError, setLogoError] = useState(false);
  const r = RADIUS[b.theme.buttonStyle];
  const style = {
    "--biz-primary": b.theme.primary,
    "--biz-background": b.theme.background ?? "var(--background)",
    "--biz-text": b.theme.text ?? "var(--foreground)",
    "--biz-button-background": b.theme.buttonBackground ?? "var(--card)",
    "--biz-button-text": b.theme.buttonText ?? "var(--foreground)",
    "--biz-review-text": b.theme.reviewText ?? "var(--primary-foreground)",
    "--biz-logo-size": `${b.theme.logoSize ?? 96}px`,
    "--biz-gap": `${b.theme.spacing ?? 12}px`,
  } as CSSProperties;
  return (
    <div className={`business-page ${preview ? "min-h-full" : "min-h-screen"}`} style={style}>
      {b.cover && (
        <img src={b.cover} alt={`${b.name} cover`} className="h-36 w-full object-cover" />
      )}
      <div
        className={`mx-auto flex w-full max-w-md flex-col items-center px-5 py-10 ${b.theme.font === "serif" ? "font-display" : "font-sans"}`}
      >
        {b.logo && !logoError ? (
          <img
            src={b.logo}
            alt={`${b.name} logo`}
            onError={() => setLogoError(true)}
            className={`business-logo ${b.logoShape === "rectangle" ? "business-logo-rectangle" : ""} object-contain shadow-soft ${SHAPE[b.logoShape ?? "circle"]}`}
          />
        ) : (
          <div
            className={`business-logo business-initial flex items-center justify-center font-display text-3xl ${SHAPE[b.logoShape ?? "circle"]}`}
          >
            {b.name.trim().charAt(0) || "?"}
          </div>
        )}
        <h1 className="mt-4 max-w-full wrap-break-word text-center text-3xl">
          {b.name || "Your business"}
        </h1>
        {b.tagline && (
          <p className="mt-1 max-w-full wrap-break-word text-center opacity-75">{b.tagline}</p>
        )}
        <div className="business-buttons mt-8 flex w-full flex-col">
          {buttonIds(b).map((id) => {
            const review = id === REVIEW_BUTTON_ID;
            const l = b.links.find((link) => link.id === id);
            const url = review ? reviewUrlFromInput(b.reviewUrl) : l ? buildLinkUrl(l) : null;
            if (!url || l?.hidden) return null;
            const Icon = review ? Star : l ? ICONS[l.icon ?? l.type] : Link2;
            return (
              <Button
                asChild
                key={id}
                variant="outline"
                className={`business-button ${review ? "business-review" : ""} h-auto min-h-12 w-full gap-3 whitespace-normal border-2 px-5 py-3 ${r}`}
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (!preview && b.id) {
                      const source =
                        new URLSearchParams(window.location.search).get("s") ?? "direct";
                      void fetch("/api/public/scan", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          slug: b.slug,
                          source,
                          kind: review ? "review" : "click",
                          linkId: id,
                        }),
                        keepalive: true,
                      }).catch(() => {});
                    }
                  }}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${review ? "fill-star text-star" : ""}`} />
                  <span className="min-w-0 flex-1 wrap-break-word text-center">
                    {review ? (b.reviewLabel ?? "Leave us a Google review") : l?.label}
                  </span>
                  <span className="w-5" />
                </a>
              </Button>
            );
          })}
        </div>
        <div className="mt-10 flex items-center justify-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
          <span className="text-[11px] font-medium text-slate-500">Powered by</span>
          <BrandLogo size="sm" to="/" />
        </div>
      </div>
    </div>
  );
}
