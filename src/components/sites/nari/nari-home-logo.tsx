import React from "react";
import { BRAND_CONFIG } from "@/lib/brand-config";

interface NariHomeLogoProps {
  theme?: "light" | "dark"; // "light" = on light/silk backgrounds (default for Option A); "dark" = on dark backgrounds
  compact?: boolean;
  className?: string;
  showSubtitle?: boolean;
}

export function NariHomeLogo({
  theme = "light",
  compact = false,
  className = "",
  showSubtitle = true,
}: NariHomeLogoProps) {
  const isDark = theme === "dark";

  // Brand Palette: Luxury Silk & Pearl Champagne
  const primaryColor = isDark ? "#FAF5F0" : "#1E1B18"; // Silk Ivory vs Obsidian Charcoal
  const accentColor = isDark ? "#D4BEAA" : "#9E7656"; // Pearl Gold / Champagne Bronze
  const subtitleColor = isDark ? "#C8B6A6" : "#6E5A4F"; // Warm Taupe

  const shortName = BRAND_CONFIG.shortName;
  const remainder = BRAND_CONFIG.name.startsWith(shortName)
    ? BRAND_CONFIG.name.slice(shortName.length).trim()
    : (BRAND_CONFIG.name !== shortName ? BRAND_CONFIG.name : "");

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      style={{
        fontFamily: "var(--font-display), 'Cormorant Garamond', Georgia, serif",
      }}
    >
      {/* Emblem: Stylized Luxury Lily & Pearl Motif */}
      <svg
        width={compact ? 28 : 36}
        height={compact ? 28 : 36}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-300"
        aria-hidden="true"
      >
        {/* Outer subtle pearl-gold ring */}
        <circle
          cx="24"
          cy="24"
          r="21.5"
          stroke={accentColor}
          strokeWidth="1.2"
          strokeDasharray="2 2"
          opacity="0.6"
        />
        <circle
          cx="24"
          cy="24"
          r="19"
          stroke={accentColor}
          strokeWidth="0.8"
          opacity="0.9"
        />

        {/* Center Pearl */}
        <circle cx="24" cy="24" r="3" fill={accentColor} />

        {/* Symmetrical blooming lily petals */}
        {/* Top Petal */}
        <path
          d="M24 10 C21 16, 21 21, 24 24 C27 21, 27 16, 24 10 Z"
          fill={primaryColor}
          opacity="0.9"
        />
        {/* Bottom Petal */}
        <path
          d="M24 38 C21 32, 21 27, 24 24 C27 27, 27 32, 24 38 Z"
          fill={primaryColor}
          opacity="0.9"
        />
        {/* Left Petal */}
        <path
          d="M10 24 C16 21, 21 21, 24 24 C21 27, 16 27, 10 24 Z"
          fill={primaryColor}
          opacity="0.9"
        />
        {/* Right Petal */}
        <path
          d="M38 24 C32 21, 27 21, 24 24 C27 27, 32 27, 38 24 Z"
          fill={primaryColor}
          opacity="0.9"
        />

        {/* Diagonal Soft Petals / Leaf Accents */}
        <path
          d="M14 14 C18 18, 21 21, 24 24 C21 21, 18 18, 14 14 Z"
          stroke={accentColor}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M34 14 C30 18, 27 21, 24 24 C27 21, 30 18, 34 14 Z"
          stroke={accentColor}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M14 34 C18 30, 21 27, 24 24 C21 27, 18 30, 14 34 Z"
          stroke={accentColor}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M34 34 C30 30, 27 27, 24 24 C27 27, 30 30, 34 34 Z"
          stroke={accentColor}
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>

      {/* Typography: Brand Name + Slogan */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-baseline gap-1.5">
          <span
            style={{
              color: primaryColor,
              fontSize: compact ? "1.25rem" : "1.65rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
              lineHeight: 1.1,
            }}
          >
            {shortName}
          </span>
          {remainder && (
            <span
              style={{
                color: accentColor,
                fontSize: compact ? "1.25rem" : "1.65rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.1,
              }}
            >
              {remainder}
            </span>
          )}
        </div>

        {showSubtitle && !compact && (
          <span
            style={{
              color: subtitleColor,
              fontSize: "0.68rem",
              fontWeight: 500,
              letterSpacing: "0.03em",
              fontFamily: "var(--font-sans), sans-serif",
              marginTop: "2px",
              whiteSpace: "nowrap",
            }}
          >
            {BRAND_CONFIG.slogan}
          </span>
        )}
      </div>
    </div>
  );
}
