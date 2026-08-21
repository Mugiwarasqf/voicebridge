import React from "react";

interface LogoProps {
  variant?: "dark" | "light";
  /** Controls height of the wordmark row in pixels */
  size?: number;
  className?: string;
}

/**
 * VoiceBridge logo — inline SVG waveform mark + wordmark.
 * variant="dark"  → black mark + text (for light backgrounds)
 * variant="light" → white mark + text (for dark footer/hero)
 */
export function Logo({ variant = "dark", size = 28, className = "" }: LogoProps) {
  const color = variant === "light" ? "#FFFFFF" : "#0A0A0A";
  const iconH = size;
  const iconW = size;

  return (
    <span
      className={`inline-flex items-center gap-2.5 select-none ${className}`}
      aria-label="VoiceBridge"
    >
      {/* 2 Snakes twisted together */}
      <svg
        width={iconW}
        height={iconH}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Snake 1 */}
        <path d="M 8 22 C 8 17, 16 15, 16 12 C 16 9, 8 7, 8 5" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="8" cy="5" r="2" fill={color} />
        <path d="M 8 3 L 8 1 L 7 0 M 8 1 L 9 0" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Snake 2 */}
        <path d="M 16 22 C 16 17, 8 15, 8 12 C 8 9, 16 7, 16 5" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="16" cy="5" r="2" fill={color} />
        <path d="M 16 3 L 16 1 L 15 0 M 16 1 L 17 0" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>

      {/* Wordmark */}
      <span
        style={{
          color,
          fontSize: `${Math.round(size * 0.54)}px`,
          fontWeight: 700,
          letterSpacing: "0.04em",
          lineHeight: 1,
          fontFamily: "var(--font-inter, system-ui, sans-serif)",
        }}
      >
        VoiceBridge
      </span>
    </span>
  );
}
