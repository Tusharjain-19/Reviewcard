import React from "react";
import { Link } from "@tanstack/react-router";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  className?: string;
  theme?: "light" | "dark";
  to?: string;
  href?: string;
}

const SIZE_MAP = {
  sm: { icon: 28, text: "text-lg", star: 10 },
  md: { icon: 36, text: "text-xl", star: 12 },
  lg: { icon: 44, text: "text-2xl", star: 14 },
  xl: { icon: 56, text: "text-3xl", star: 18 },
};

/**
 * Premium ReviewCard Brand Logo
 * Features a modern smart NFC card silhouette with subtle contactless waves
 * and the iconic Google multi-color review star/accent mark.
 */
export function BrandLogo({
  size = "md",
  showWordmark = true,
  className = "",
  theme = "light",
  to,
  href,
}: BrandLogoProps) {
  const s = SIZE_MAP[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Smart Card + Review Icon Emblem */}
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform hover:scale-105"
        style={{ width: s.icon, height: s.icon }}
      >
        <svg
          viewBox="0 0 48 48"
          width={s.icon}
          height={s.icon}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <defs>
            {/* Rich Google Blue to Royal Indigo gradient */}
            <linearGradient id="rc-card-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a73e8" />
              <stop offset="60%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            {/* Inner glossy card highlight */}
            <linearGradient id="rc-card-glaze" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Gold star gradient */}
            <linearGradient id="rc-star-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
          </defs>

          {/* Main Card Base */}
          <rect x="2" y="4" width="44" height="40" rx="12" fill="url(#rc-card-bg)" />

          {/* Glaze reflection top half */}
          <path
            d="M2 16C2 9.37258 7.37258 4 14 4H34C40.6274 4 46 9.37258 46 16V22L2 28V16Z"
            fill="url(#rc-card-glaze)"
          />

          {/* Inset subtle border */}
          <rect
            x="2.75"
            y="4.75"
            width="42.5"
            height="38.5"
            rx="11.25"
            stroke="#ffffff"
            strokeOpacity="0.22"
            strokeWidth="1.5"
          />

          {/* Contactless NFC Waves in Top-Right */}
          <g stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
            <path d="M35 12C36.8 14 36.8 17 35 19" />
            <path d="M38.5 9.5C41.5 12.5 41.5 18.5 38.5 21.5" />
          </g>

          {/* Center Iconic Google 'G' Symbol with authentic multi-color geometry */}
          <g transform="translate(13, 14)">
            {/* White background badge disc */}
            <circle cx="11" cy="11" r="10.5" fill="#ffffff" />

            {/* Google G Paths (Official Geometry scaled to 16x16) */}
            {/* Blue arm */}
            <path
              d="M17.8 11.2C17.8 10.6 17.75 10.05 17.65 9.5H11V12.7H14.85C14.68 13.6 14.15 14.38 13.35 14.9V16.75H15.8C17.2 15.45 18 13.5 18 11.2H17.8Z"
              fill="#4285F4"
            />
            {/* Green base */}
            <path
              d="M11 18.2C12.95 18.2 14.6 17.55 15.8 16.45L13.35 14.6C12.7 15.05 11.9 15.3 11 15.3C9.1 15.3 7.5 14.05 6.95 12.35H4.4V14.25C5.6 16.65 8.1 18.2 11 18.2Z"
              fill="#34A853"
            />
            {/* Yellow left curve */}
            <path
              d="M6.95 12.35C6.8 11.9 6.7 11.45 6.7 11C6.7 10.55 6.8 10.1 6.95 9.65V7.75H4.4C3.9 8.75 3.6 9.85 3.6 11C3.6 12.15 3.9 13.25 4.4 14.25L6.95 12.35Z"
              fill="#FBBC05"
            />
            {/* Red top curve */}
            <path
              d="M11 6.7C12.05 6.7 13 7.05 13.75 7.75L16.15 5.35C14.7 4 13 3.2 11 3.2C8.1 3.2 5.6 4.75 4.4 7.15L6.95 9.05C7.5 7.35 9.1 6.7 11 6.7Z"
              fill="#EA4335"
            />
          </g>

          {/* Smart Contactless Chip on bottom-left */}
          <rect
            x="6"
            y="29"
            width="8"
            height="6.5"
            rx="1.5"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="0.8"
          />
          <line x1="10" y1="29" x2="10" y2="35.5" stroke="#b45309" strokeWidth="0.6" />
          <line x1="6" y1="32.25" x2="14" y2="32.25" stroke="#b45309" strokeWidth="0.6" />
        </svg>
      </div>

      {/* Brand Name Typography */}
      {showWordmark && (
        <div className="flex items-baseline tracking-tight">
          <span
            className={`font-display font-black tracking-tight ${s.text} ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            Review
          </span>
          <span className={`font-display font-black tracking-tight ${s.text} text-blue-600 ml-0.5`}>
            Card
          </span>
          <span className="ml-1.5 hidden sm:inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 tracking-wider uppercase border border-blue-200/60">
            PRO
          </span>
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
        title="ReviewCard Home"
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        className="inline-flex items-center transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
        title="ReviewCard Home"
      >
        {content}
      </a>
    );
  }

  return content;
}
