"use client";

import React, { useState } from "react";
import Link from "next/link";

const SAMPLE_TEXT =
  "VoiceBridge converts your text to natural-sounding speech in seconds. Try typing anything here and press the play button to hear it.";

const VOICES = [
  { value: "Joanna", label: "Joanna", sublabel: "US English" },
  { value: "Matthew", label: "Matthew", sublabel: "US English" },
  { value: "Amy", label: "Amy", sublabel: "British" },
];

const ENGINES = [
  { value: "neural", label: "Neural" },
  { value: "standard", label: "Standard" },
];

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<"tts" | "stt">("tts");
  const [voice, setVoice] = useState("Joanna");
  const [engine, setEngine] = useState("neural");

  return (
    <section
      id="hero"
      className="relative flex flex-col items-center text-center px-6 pt-32 pb-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, #EAF1FB 0%, #FFFFFF 70%)",
      }}
    >
      {/* Headline */}
      <div className="animate-fade-in-up max-w-4xl mx-auto">
        <p className="eyebrow mb-5">Text to Speech · Speech to Text</p>
        <h1
          className="font-bold tracking-tight text-[#0A0A0A] mb-5"
          style={{ fontSize: "clamp(2.4rem,5.5vw,4rem)", lineHeight: 1.08 }}
        >
          Your Voice.{" "}
          <span style={{ color: "#0A0A0A" }}>Your Cloud.</span>
          <br />
          Your Rules.
        </h1>
        <p className="text-[#6B7280] text-lg leading-relaxed max-w-xl mx-auto mb-8">
          Natural-sounding text-to-speech and accurate transcription—powered by
          Amazon Polly &amp; Transcribe, deployed in your own AWS account.
        </p>
      </div>

      {/* CTA buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-14 animate-fade-in-up">
        <Link href="/signup" className="btn-pill btn-solid px-7 py-3 text-base">
          Get Started Free
        </Link>
        <a
          href="#docs"
          className="btn-pill btn-outline px-7 py-3 text-base"
        >
          View Docs
        </a>
      </div>

      {/* Floating playground demo card */}
      <div
        className="w-full max-w-3xl mx-auto card card-lg p-0 overflow-hidden animate-fade-in-up"
        style={{
          boxShadow: "0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        {/* Tab bar */}
        <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-[#F0F0F0]">
          <div className="flex items-center gap-1 bg-[#F3F4F6] rounded-full p-1">
            <button
              onClick={() => setActiveTab("tts")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === "tts"
                  ? "bg-[#0A0A0A] text-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#0A0A0A]"
              }`}
            >
              Text to Speech
            </button>
            <button
              onClick={() => setActiveTab("stt")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeTab === "stt"
                  ? "bg-[#0A0A0A] text-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#0A0A0A]"
              }`}
            >
              Speech to Text
            </button>
          </div>
          <span className="ml-auto text-xs text-[#9CA3AF]">Demo — sign in to use</span>
        </div>

        {/* Tab content */}
        {activeTab === "tts" ? (
          <div className="px-5 pt-4 pb-5">
            <textarea
              className="w-full resize-none bg-transparent text-[#0A0A0A] text-sm leading-relaxed placeholder-[#D1D5DB] outline-none min-h-[110px]"
              defaultValue={SAMPLE_TEXT}
              maxLength={3000}
              aria-label="Text to synthesize (demo)"
            />
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#F0F0F0]">
              {/* Voice selector */}
              <div className="relative">
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="appearance-none bg-[#F3F4F6] text-[#0A0A0A] text-xs font-medium px-3 py-1.5 pr-6 rounded-full cursor-pointer border-none outline-none hover:bg-[#EAECEF] transition-colors"
                  aria-label="Voice"
                >
                  {VOICES.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label} · {v.sublabel}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-xs">▾</span>
              </div>

              {/* Engine selector */}
              <div className="relative">
                <select
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                  className="appearance-none bg-[#F3F4F6] text-[#0A0A0A] text-xs font-medium px-3 py-1.5 pr-6 rounded-full cursor-pointer border-none outline-none hover:bg-[#EAECEF] transition-colors"
                  aria-label="Engine"
                >
                  {ENGINES.map((eng) => (
                    <option key={eng.value} value={eng.value}>{eng.label}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-xs">▾</span>
              </div>

              {/* Play button */}
              <Link
                href="/signup"
                className="ml-auto flex items-center justify-center w-10 h-10 rounded-full bg-[#0A0A0A] text-white hover:bg-[#2a2a2a] transition-colors shadow-sm"
                aria-label="Sign up to play"
                title="Sign up to use"
              >
                <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
                  <path d="M2 1.5L12 8L2 14.5V1.5Z" fill="white" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          /* STT tab — upload dropzone (visual only) */
          <div className="px-5 pt-4 pb-5">
            <Link
              href="/signup"
              className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-[#E5E7EB] rounded-2xl hover:border-[#9CA3AF] hover:bg-[#F9FAFB] transition-all duration-200 group cursor-pointer"
              aria-label="Sign up to upload audio"
            >
              <svg
                className="w-10 h-10 text-[#D1D5DB] group-hover:text-[#9CA3AF] transition-colors mb-3"
                viewBox="0 0 40 40" fill="none" aria-hidden="true"
              >
                <path d="M20 8v16M13 15l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 30h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p className="text-sm font-medium text-[#6B7280] group-hover:text-[#374151]">
                Drop an audio file here, or{" "}
                <span className="underline underline-offset-2">sign up to upload</span>
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                mp3, mp4, m4a, wav, flac, ogg, webm, amr
              </p>
            </Link>
          </div>
        )}
      </div>

      {/* Gradient fade-into-next-section */}
      <div
        className="w-full h-24 mt-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, #FAFAFA 100%)",
        }}
        aria-hidden="true"
      />
    </section>
  );
}
