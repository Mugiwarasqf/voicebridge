import React from "react";
import Link from "next/link";

const TIERS = [
  {
    name: "Light",
    badge: null,
    cost: "~$4.55",
    period: "/ month",
    description: "Perfect for personal projects and prototyping.",
    includes: [
      "~500 TTS requests (avg 200 words each)",
      "~100 minutes of transcription",
      "Free-tier Lambda & API Gateway",
      "S3 + CloudFront hosting (~$0.50)",
      "Cognito (free under 50K MAU)",
    ],
    cta: "Deploy to My AWS",
    elevated: false,
  },
  {
    name: "Moderate",
    badge: "Most Common",
    cost: "~$20",
    period: "/ month",
    description: "Ideal for small teams, internal tools, and MVPs.",
    includes: [
      "~5,000 TTS requests",
      "~500 minutes of transcription",
      "Everything in Light",
      "Roughly 10× the request volume",
      "Costs scale linearly — no surprises",
    ],
    cta: "Deploy to My AWS",
    elevated: true,
  },
  {
    name: "Heavy",
    badge: null,
    cost: "~$70",
    period: "/ month",
    description: "High-throughput workloads and production apps.",
    includes: [
      "~50,000 TTS requests",
      "~2,000 minutes of transcription",
      "Everything in Moderate",
      "Polly & Transcribe are the cost drivers",
      "Add usage quotas per user if selling access",
    ],
    cta: "Deploy to My AWS",
    elevated: false,
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
            Estimate Your Monthly Cost
          </h2>
          <p className="text-[#6B7280] text-base max-w-lg mx-auto leading-relaxed">
            You pay AWS directly — no VoiceBridge subscription. These are real
            cost estimates based on current AWS pricing in <strong>eu-west-2</strong>.
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

              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`btn-pill w-full text-sm ${
                  tier.elevated ? "btn-solid" : "btn-outline"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-[#9CA3AF] mt-8">
          Pricing based on AWS eu-west-2. See{" "}
          <a href="https://aws.amazon.com/polly/pricing/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#6B7280]">Polly</a>
          {" "}and{" "}
          <a href="https://aws.amazon.com/transcribe/pricing/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#6B7280]">Transcribe</a>
          {" "}pricing pages for current rates.
        </p>
      </div>
    </section>
  );
}
