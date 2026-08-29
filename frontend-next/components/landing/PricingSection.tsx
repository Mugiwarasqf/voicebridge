import React from "react";
import Link from "next/link";

const TIERS = [
  {
    name: "Free",
    badge: null,
    cost: "$0",
    period: "/ month",
    description: "Try out text-to-speech and transcription with no commitment.",
    includes: [
      "10,000 TTS characters / month",
      "Standard voice engine",
      "30 minutes of transcription / month",
      "Limited voice selection",
      "In-app playback (no downloads)",
    ],
    cta: "Get Started Free",
    href: "/signup",
    elevated: false,
    downloadEnabled: false,
  },
  {
    name: "Pro",
    badge: "Most Popular",
    cost: "$9",
    period: "/ month",
    description: "For regular use — full voice quality and more transcription minutes.",
    includes: [
      "150,000 TTS characters / month",
      "Neural + Standard voice engines",
      "300 minutes of transcription / month",
      "Full voice library",
      "Download generated audio",
    ],
    cta: "Upgrade to Pro",
    href: "/signup?plan=pro",
    elevated: true,
    downloadEnabled: true,
  },
  {
    name: "Team",
    badge: null,
    cost: "$29",
    period: "/ month",
    description: "Built for teams with heavier, ongoing production needs.",
    includes: [
      "750,000 TTS characters / month",
      "Neural + Standard voice engines",
      "1,500 minutes of transcription / month",
      "Full voice library",
      "Download generated audio",
    ],
    cta: "Upgrade to Team",
    href: "/signup?plan=team",
    elevated: false,
    downloadEnabled: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-24" style={{ backgroundColor: "#F5F6F8" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="eyebrow mb-4">Pricing</p>
          <h2
            className="font-bold text-[#0A0A0A] mb-4"
            style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", lineHeight: 1.15 }}
          >
            Simple, straightforward pricing
          </h2>
          <p className="text-[#6B7280] text-base max-w-lg mx-auto leading-relaxed">
            Start free. Upgrade when you need more speech, more minutes, or the ability to download your audio.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-card-lg p-8 transition-all duration-200 relative ${
                tier.elevated
                  ? "bg-white border-2 border-[#0A0A0A] shadow-card-hover md:scale-[1.04]"
                  : "bg-white border border-[#EEEEEE] shadow-card"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#0A0A0A] text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                    {tier.badge}
                  </span>
                </div>
              )}

              <h3 className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider mb-2">
                {tier.name}
              </h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className="font-bold text-[#0A0A0A]"
                  style={{ fontSize: "clamp(2rem,4vw,2.5rem)", lineHeight: 1 }}
                >
                  {tier.cost}
                </span>
                <span className="text-[#9CA3AF] text-sm">{tier.period}</span>
              </div>
              <p className="text-sm text-[#6B7280] mb-6 leading-relaxed">
                {tier.description}
              </p>

              {/* Checklist */}
              <ul className="space-y-3 mb-8">
                {tier.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-[#374151]">
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#10B981]"
                      viewBox="0 0 16 16" fill="none" aria-hidden="true"
                    >
                      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`btn-pill w-full text-sm block text-center ${
                  tier.elevated ? "btn-solid" : "btn-outline"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}