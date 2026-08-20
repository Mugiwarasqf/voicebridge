"use client";

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ttsSchema,
  type TtsFormValues,
  POLLY_VOICES,
  POLLY_VOICE_LABELS,
} from "@/lib/schemas";
import { ApiClient, ApiError } from "@/lib/api";
import { AudioPlayer } from "./AudioPlayer";

const MAX_CHARS = 3000;
const WARN_CHARS = 2700;

function getVoiceLabel(voiceId?: string): string {
  if (!voiceId) return "";
  return (POLLY_VOICE_LABELS as Record<string, string>)[voiceId] ?? voiceId;
}

interface TtsFormProps {
  api: ApiClient;
  onJobComplete?: () => void;
}

export function TtsForm({ api, onJobComplete }: TtsFormProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<{
    text: string;
    voiceId: string;
    engine: string;
  } | null>(null);
  const [dismissedNotice, setDismissedNotice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TtsFormValues>({
    resolver: zodResolver(ttsSchema),
    defaultValues: { text: "", voiceId: "Joanna", engine: "neural" },
  });

  const textVal = watch("text");
  const currentVoice = watch("voiceId");
  const currentEngine = watch("engine");
  const charCount = textVal?.length ?? 0;

  // Detect changes between form state and currently synthesized audio
  const isVoiceChanged = Boolean(
    lastGenerated && audioUrl && currentVoice !== lastGenerated.voiceId
  );
  const isEngineChanged = Boolean(
    lastGenerated && audioUrl && currentEngine !== lastGenerated.engine
  );
  const isTextChanged = Boolean(
    lastGenerated && audioUrl && textVal.trim() !== lastGenerated.text.trim()
  );
  const hasChanges = isVoiceChanged || isEngineChanged || isTextChanged;

  const onSubmit = async (values: TtsFormValues) => {
    setError(null);
    setAudioUrl(null);
    setDismissedNotice(false);
    try {
      const result = await api.postTts({
        text: values.text,
        voiceId: values.voiceId,
        engine: values.engine,
      });
      // Fetch the audio blob to create an object URL for the player
      const blob = await fetch(result.audioUrl).then((r) => r.blob());
      setAudioUrl(URL.createObjectURL(blob));
      setLastGenerated({
        text: values.text,
        voiceId: values.voiceId,
        engine: values.engine,
      });
      onJobComplete?.();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";
      setError(msg);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Textarea */}
      <div>
        <div className="relative">
          <textarea
            id="tts-text"
            {...register("text")}
            maxLength={MAX_CHARS}
            rows={6}
            placeholder="Type or paste up to 3,000 characters of text to synthesize…"
            className={`w-full resize-none rounded-xl border px-4 py-3 text-sm text-[#0A0A0A] placeholder-[#D1D5DB] leading-relaxed transition-colors outline-none focus-visible:outline-[#111111] ${
              errors.text
                ? "border-red-300 bg-red-50/30"
                : "border-[#E5E7EB] bg-[#FAFAFA] focus:bg-white"
            }`}
          />
          {/* Character counter */}
          <span
            className={`absolute bottom-2.5 right-3 text-xs font-mono tabular-nums transition-colors ${
              charCount > MAX_CHARS
                ? "text-red-500 font-semibold"
                : charCount > WARN_CHARS
                ? "text-amber-500"
                : "text-[#D1D5DB]"
            }`}
          >
            {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
        </div>
        {errors.text && (
          <p className="mt-1.5 text-xs text-red-500">{errors.text.message}</p>
        )}
      </div>

      {/* Voice + Engine row */}
      <div className="flex flex-wrap gap-3 items-start">
        {/* Voice */}
        <div className="flex-1 min-w-[160px]">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="tts-voice" className="block text-xs font-medium text-[#6B7280]">
              Voice
            </label>
            {isVoiceChanged && (
              <span className="text-[10px] font-semibold text-amber-600 animate-pulse">
                • Changed
              </span>
            )}
          </div>
          <div className="relative">
            <select
              id="tts-voice"
              {...register("voiceId", {
                onChange: () => setDismissedNotice(false),
              })}
              className={`w-full appearance-none text-[#0A0A0A] text-sm font-medium px-3.5 py-2.5 pr-8 rounded-xl cursor-pointer border outline-none focus-visible:outline-[#111111] transition-all ${
                isVoiceChanged
                  ? "bg-amber-50/40 border-amber-300 text-amber-900"
                  : "bg-[#F3F4F6] border-transparent hover:border-[#E5E7EB]"
              }`}
            >
              {POLLY_VOICES.map((v) => (
                <option key={v} value={v}>
                  {POLLY_VOICE_LABELS[v]}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">▾</span>
          </div>
          {errors.voiceId && (
            <p className="mt-1 text-xs text-red-500">{errors.voiceId.message}</p>
          )}
        </div>

        {/* Engine */}
        <div className="flex-1 min-w-[140px]">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="tts-engine" className="block text-xs font-medium text-[#6B7280]">
              Engine
            </label>
            {isEngineChanged && (
              <span className="text-[10px] font-semibold text-amber-600 animate-pulse">
                • Changed
              </span>
            )}
          </div>
          <div className="relative">
            <select
              id="tts-engine"
              {...register("engine", {
                onChange: () => setDismissedNotice(false),
              })}
              className={`w-full appearance-none text-[#0A0A0A] text-sm font-medium px-3.5 py-2.5 pr-8 rounded-xl cursor-pointer border outline-none focus-visible:outline-[#111111] transition-all ${
                isEngineChanged
                  ? "bg-amber-50/40 border-amber-300 text-amber-900"
                  : "bg-[#F3F4F6] border-transparent hover:border-[#E5E7EB]"
              }`}
            >
              <option value="neural">Neural (higher quality)</option>
              <option value="standard">Standard (cheaper)</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">▾</span>
          </div>
          {errors.engine && (
            <p className="mt-1 text-xs text-red-500">{errors.engine.message}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-end pb-0">
          <button
            id="tts-submit-btn"
            type="submit"
            disabled={isSubmitting || charCount > MAX_CHARS}
            className={`btn-pill btn-solid px-6 py-2.5 text-sm self-end transition-all ${
              hasChanges && audioUrl
                ? "ring-2 ring-[#0A0A0A] ring-offset-2 scale-[1.02] shadow-md"
                : ""
            }`}
            style={{ marginTop: "auto" }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="spinner" /> Synthesizing…
              </span>
            ) : hasChanges && audioUrl ? (
              "Re-synthesize Audio"
            ) : (
              "Synthesize"
            )}
          </button>
        </div>
      </div>

      {/* Professional Toast Notification for Voice/Settings Change */}
      {hasChanges && !dismissedNotice && audioUrl && lastGenerated && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 border border-amber-200/80 p-3.5 shadow-sm animate-fade-in-up transition-all duration-300">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Dynamic waveform icon */}
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-xs">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M2 8v0M4.5 5v6M7 2v12M9.5 4v8M12 6v4M14 8v0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0A0A0A] flex items-center gap-2 flex-wrap">
                  {isVoiceChanged ? (
                    <>
                      <span>Voice switched:</span>
                      <span className="line-through text-[#9CA3AF] font-normal">
                        {getVoiceLabel(lastGenerated.voiceId)}
                      </span>
                      <span className="text-[#0A0A0A]">→</span>
                      <span className="text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md font-bold text-[11px]">
                        {getVoiceLabel(currentVoice)}
                      </span>
                    </>
                  ) : isEngineChanged ? (
                    <>
                      <span>Engine switched to</span>
                      <span className="text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md font-bold text-[11px] capitalize">
                        {currentEngine}
                      </span>
                    </>
                  ) : (
                    <span>Text updated</span>
                  )}
                </p>
                <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">
                  The audio player below is currently playing the previous synthesis. Click <span className="font-semibold text-[#0A0A0A]">Re-synthesize</span> to generate with the new voice.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-pill btn-solid text-xs px-3.5 py-1.5 font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                {isSubmitting ? "Synthesizing…" : "Synthesize Now"}
              </button>
              <button
                type="button"
                onClick={() => setDismissedNotice(true)}
                className="w-6 h-6 rounded-lg text-[#9CA3AF] hover:text-[#0A0A0A] hover:bg-black/5 flex items-center justify-center transition-colors text-xs"
                title="Dismiss"
                aria-label="Dismiss notice"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Audio player with Status Header */}
      {audioUrl && (
        <div className="space-y-1 pt-1">
          {lastGenerated && (
            <div className="flex items-center justify-between text-xs px-1 text-[#6B7280]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-medium text-[#0A0A0A]">
                  Audio output:{" "}
                  <span className="text-[#6B7280] font-normal">
                    {getVoiceLabel(lastGenerated.voiceId)} ({lastGenerated.engine})
                  </span>
                </span>
              </div>
              {hasChanges && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Settings changed
                </span>
              )}
            </div>
          )}
          <AudioPlayer src={audioUrl} />
        </div>
      )}
    </form>
  );
}
