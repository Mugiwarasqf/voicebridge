import React from "react";

const FEATURES = [
  {
    index: "01",
    title: "Studio-Quality Voices, Built In",
    desc: "Switch between Neural and Standard engines depending on what you need natural, expressive speech for polished output, or a lighter engine when you're iterating quickly. Choose from a full library of voices, and if you tweak your text, voice, or engine after generating, we'll flag it before you accidentally publish something out of sync.",
    elevated: false,
  },
  {
    index: "02",
    title: "One Workflow for Speech and Text",
    desc: "Most tools make you choose: synthesize speech or transcribe audio. VoiceBridge does both in a single, cohesive workflow. Drop in an audio file and watch it move through upload, processing, and transcription in real time, or generate speech and play it back instantly  no switching tools, no juggling exports.",
    elevated: true,
  },
  {
    index: "03",
    title: "Fair, Transparent Pricing",
    desc: "No confusing usage math or surprise invoices. Every tier lists exactly what you get  characters per month, transcription minutes, voice access in plain terms. Start free, and upgrade only when you actually need more. Downloads, higher limits, and full voice access come standard once you do.",
    elevated: false,
  },
];

export function WhySection() {
  return (
    <section id="product" className="relative px-6 py-24 overflow-hidden" style={{ backgroundColor: "#F5F6F8" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-26">
          <p className="eyebrow mb-4 tracking-[0.18em] text-xs font-medium text-[#6B7280]">
            WHY VOICEBRIDGE
          </p>
          <h2
            className="font-bold text-[#0A0A0A] max-w-2xl mx-auto"
            style={{ fontSize: "clamp(1.75rem,3.5vw,2.5rem)", lineHeight: 1.15 }}
          >
            Effortless to use.{" "}
            <span className="text-[#6B7280] font-normal">
              Built to actually get out of your way.
            </span>
          </h2>
        </div>

        {/* Feature grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-2 justify-items-center max-w-5xl mx-auto items-start">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`relative rounded-card max-w-[320px] min-h-[380px] p-6 flex flex-col text-left transition-all duration-200 ${
                f.elevated
                  ? "bg-white border border-[#EEEEEE] shadow-card md:-translate-y-6 z-10"
                  : "bg-white/60 border border-[#EEEEEE]/70"
              }`}
            >
              <span
                className="font-bold mb-10"
                style={{
                  fontSize: "2.75rem",
                  lineHeight: 1,
                  color: f.elevated ? "#02011dff" : "#D1D5DB",
                }}
              >
                {f.index}
              </span>

              <h3 className="text-base font-semibold text-[#0A0A0A] mb-3">{f.title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}