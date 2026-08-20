"use client";

import React, { useState } from "react";
import { TtsForm } from "./TtsForm";
import { SttForm } from "./SttForm";
import { ApiClient } from "@/lib/api";

type Tab = "tts" | "stt";

interface PlaygroundCardProps {
  api: ApiClient;
  onJobComplete?: () => void;
}

export function PlaygroundCard({ api, onJobComplete }: PlaygroundCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("tts");

  return (
    <div className="card card-lg p-0 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-[#F0F0F0]">
        <div className="flex items-center gap-1 bg-[#F3F4F6] rounded-full p-1">
          <button
            id="playground-tts-tab"
            type="button"
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
            id="playground-stt-tab"
            type="button"
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
      </div>

      {/* Form content */}
      <div className="p-5">
        {activeTab === "tts" ? (
          <TtsForm api={api} onJobComplete={onJobComplete} />
        ) : (
          <SttForm api={api} onJobComplete={onJobComplete} />
        )}
      </div>
    </div>
  );
}
