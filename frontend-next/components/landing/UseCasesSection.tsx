"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";

/* ---------- Tilt wrapper (kept from before) ---------- */

function TiltCard({ children, shadowColor }: { children: React.ReactNode; shadowColor: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setStyle({
      transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015,1.015,1.015)`,
      boxShadow: `${-rotateY * 1.5}px ${rotateX * 1.5 + 14}px 34px -10px ${shadowColor}`,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)",
      boxShadow: `0px 10px 24px -10px ${shadowColor}`,
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 0.15s ease-out, box-shadow 0.15s ease-out",
        transformStyle: "preserve-3d",
        boxShadow: `0px 10px 24px -10px ${shadowColor}`,
        ...style,
      }}
      className="rounded-lg"
    >
      {children}
    </div>
  );
}

const offerings = [
  {
    index: "01",
    id: "tts",
    title: "Text-to-Speech Studio",
    description:
      "Synthesize up to 3,000 characters with live character counting, natural voices, Neural vs. Standard engine switching, smart re-synthesis detection, and instant in-app playback.",
    shadowColor: "rgba(10,10,10,0.18)",
    image: "/previews/tts-preview.png",
  },
  {
    index: "02",
    id: "stt",
    title: "Speech-to-Text Studio",
    description:
      "Drag-and-drop audio uploads with format validation, language selection for improved accuracy, and a clean transcript viewer with word count and one-click copy.",
    shadowColor: "rgba(10,10,10,0.18)",
    image: "/previews/stt-preview.png",
  },
  {
    index: "03",
    id: "pipeline",
    title: "Smart Pipeline & Direct S3",
    description:
      "Secure direct-to-S3 uploads via presigned URLs with live progress tracking, real-time job status monitoring, and change detection when your inputs shift.",
    shadowColor: "rgba(10,10,10,0.18)",
    image: "/previews/pipeline-preview.png",
  },
];

export function UseCasesSection() {
  return (
    <section id="product" className="py-28 bg-white">
      <div className="max-w-[1100px] mx-auto px-6">
        {/* Header */}
        <div className="mb-20 max-w-xl">
          <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#9CA3AF] mb-4">
            What we offer
          </p>
          <h2
            className="font-bold text-[#0A0A0A]"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)", lineHeight: 1.2, letterSpacing: "-0.02em" }}
          >
            Precision speech tools, engineered for your workflow.
          </h2>
        </div>

        {/* Alternating rows */}
        <div className="flex flex-col gap-24">
          {offerings.map((uc, i) => {
            const imageFirst = i % 2 === 0;
            return (
              <div
                key={uc.id}
                className={`flex flex-col ${
                  imageFirst ? "md:flex-row" : "md:flex-row-reverse"
                } items-center gap-10 md:gap-16`}
              >
                {/* Image */}
                <div className="w-full md:w-1/2">
                  <TiltCard shadowColor={uc.shadowColor}>
                    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-[#EDEDED]">
                      <Image src={uc.image} alt={uc.title} fill className="object-cover" />
                    </div>
                  </TiltCard>
                </div>

                {/* Text */}
                <div className="w-full md:w-1/2">
                  <span
                    className="block font-bold text-[#D1D5DB] mb-4"
                    style={{ fontSize: "2.5rem", lineHeight: 1 }}
                  >
                    {uc.index}
                  </span>
                  <h3 className="text-xl font-semibold text-[#0A0A0A] mb-3">{uc.title}</h3>
                  <p className="text-[#6B7280] leading-relaxed max-w-md">{uc.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}