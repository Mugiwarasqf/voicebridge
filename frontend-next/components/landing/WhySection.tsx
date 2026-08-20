import React from "react";

function WaveformIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <rect x="1" y="18" width="4" height="8" rx="2" fill="currentColor" opacity="0.9"/>
      <rect x="7" y="8" width="4" height="18" rx="2" fill="currentColor"/>
      <rect x="13" y="13" width="4" height="13" rx="2" fill="currentColor" opacity="0.8"/>
      <rect x="19" y="4" width="4" height="22" rx="2" fill="currentColor" opacity="0.7"/>
      <rect x="25" y="16" width="3" height="10" rx="1.5" fill="currentColor" opacity="0.5"/>
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M8 20a5 5 0 01-.5-9.98A7 7 0 0121 14a4 4 0 01-1 7.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M14 16v6M11 19l3-3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 3L5 7v8c0 5 4 9.4 9 10 5-.6 9-5 9-10V7L14 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M10 14l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const FEATURES = [
  {
    icon: <WaveformIcon />,
    iconBg: "from-blue-50 to-indigo-50",
    iconColor: "text-indigo-500",
    title: "Own Your Infrastructure",
    desc: "Deployed into your AWS account via Terraform. Your audio and transcripts never touch a third-party server.",
    elevated: false,
  },
  {
    icon: <CloudIcon />,
    iconBg: "from-violet-50 to-purple-50",
    iconColor: "text-violet-500",
    title: "Pay Only for Usage",
    desc: "AWS Polly charges per character, Transcribe per minute. A typical light workload costs under $5/month — no seat fees.",
    elevated: true,
  },
  {
    icon: <ShieldIcon />,
    iconBg: "from-emerald-50 to-teal-50",
    iconColor: "text-emerald-500",
    title: "No Vendor Lock-in",
    desc: "Standard AWS services, fully Terraform-managed. Fork it, extend it, or tear it down anytime.",
    elevated: false,
  },
];

export function WhySection() {
  return (
    <section
      id="product"
      className="px-6 py-24"
      style={{ backgroundColor: "#F5F6F8" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="eyebrow mb-4">Why VoiceBridge</p>
          <h2
            className="font-bold text-[#0A0A0A] max-w-2xl mx-auto"
            style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", lineHeight: 1.15 }}
          >
            Own your AI voice stack —{" "}
            <span className="text-[#6B7280] font-normal">
              no vendor lock-in, no per-seat pricing, no surprises.
            </span>
          </h2>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`rounded-card p-7 transition-all duration-200 ${
                f.elevated
                  ? "bg-white border border-[#EEEEEE] shadow-card scale-[1.02]"
                  : "bg-[#F5F6F8]"
              }`}
            >
              {/* Icon */}
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${f.iconBg} ${f.iconColor} mb-5`}
              >
                {f.icon}
              </div>

              <h3 className="text-base font-semibold text-[#0A0A0A] mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
