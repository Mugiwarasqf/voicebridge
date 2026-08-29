"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex flex-col items-center text-center px-6 pt-32 pb-0 overflow-hidden"
      style={{
        background: "white",
      }}
    >
      {/* Headline */}
      <div className="animate-fade-in-up max-w-4xl mx-auto">
        <p className="eyebrow mb-5">Text-to-Speech · Speech-to-Text</p>
        <h1
          className="font-bold tracking-tight text-[#0A0A0A] mb-5"
          style={{ fontSize: "clamp(2.4rem,5.5vw,4rem)", lineHeight: 1.08 }}
        >
          Synthesize speech.
          <br />
          <span style={{ color: "#0A0A0A" }}>Transcribe audio.Keep full control.</span>
        </h1>
        <p className="text-[#6B7280] text-lg leading-relaxed max-w-xl mx-auto mb-8">
          Generate natural speech and accurate transcripts. 
        </p>
      </div>

      {/* CTA buttons */}
      <div className="relative z-10 flex flex-wrap gap-3 justify-center mb-14 animate-fade-in-up">
        <Link href="/signup" className="btn-pill btn-solid px-7 py-3 text-base">
          Get Started Free
        </Link>
        {/* <a href="#docs" className="btn-pill btn-outline px-7 py-3 text-base">
          View Docs
        </a> */}
      </div>

      <div className="relative z-0 sm:-mt-0 lg:-mt-20 -mt-0">
        <Image
          src="/ChatGPT Image Aug 21, 2026, 12_08_20 AM.png"
          alt="VoiceBridge Application Preview"
          width={1200}
          height={675}
          className="w-full h-auto object-cover hidden md:block "
          priority
        />
      </div>
    </section>
  );
}