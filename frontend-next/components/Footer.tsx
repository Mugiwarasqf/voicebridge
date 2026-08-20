"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const FOOTER_LINKS: Array<{ heading: string; links: Array<{ label: string; href: string }> }> = [
  {
    heading: "Product",
    links: [
      { label: "How it Works", href: "#product" },
      { label: "API", href: "#docs" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs", href: "#docs" },
      { label: "API Reference", href: "#docs" },
      { label: "Tutorial", href: "#" },
      { label: "System Guide", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "GitHub", href: "https://github.com" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Use", href: "#" },
      { label: "Accessibility", href: "#" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();

  // Hide marketing footer on authenticated workspace
  if (pathname?.startsWith("/app")) return null;

  return (
    <footer
      style={{ backgroundColor: "#0B0B0F" }}
      className="relative text-white overflow-hidden"
      aria-label="Site footer"
    >
      {/* Giant wordmark — sits BEHIND everything else */}
      <p
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 z-0 select-none pointer-events-none translate-y-[28%]"
        style={{
          fontSize: "clamp(6rem, 18vw, 14rem)",
          fontWeight: 800,
          letterSpacing: "0.04em",
          lineHeight: 0.8,
          color: "rgba(255,255,255,0.08)",
          textAlign: "center",
          whiteSpace: "nowrap",
          fontFamily: "var(--font-inter, system-ui, sans-serif)",
        }}
      >
        VOICEBRIDGE
      </p>

      {/* Foreground content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-8">
        {/* Top row: logo + link columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          {/* Logo */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" aria-label="VoiceBridge home">
              <Logo variant="light" size={26} />
            </Link>
            <p className="mt-4 text-sm text-[#6B7280] leading-relaxed max-w-[180px]">
              Your voice infrastructure, on your terms.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.heading}>
              <p className="eyebrow text-[#4B5563] mb-4">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#9CA3AF] hover:text-white transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-6" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#4B5563]">
          <span>© {new Date().getFullYear()} VoiceBridge. All rights reserved.</span>
          <span>Built on AWS · Powered by Polly &amp; Transcribe</span>
        </div>
      </div>
    </footer>
  );
}