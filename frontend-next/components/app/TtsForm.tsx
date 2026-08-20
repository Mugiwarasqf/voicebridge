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

interface TtsFormProps {
  api: ApiClient;
}

export function TtsForm({ api }: TtsFormProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
  const charCount = textVal?.length ?? 0;

  const onSubmit = async (values: TtsFormValues) => {
    setError(null);
    setAudioUrl(null);
    try {
      const result = await api.postTts({
        text: values.text,
        voiceId: values.voiceId,
        engine: values.engine,
      });
      // Fetch the audio blob to create an object URL for the player
      const blob = await fetch(result.audioUrl).then((r) => r.blob());
      setAudioUrl(URL.createObjectURL(blob));
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
          <label htmlFor="tts-voice" className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Voice
          </label>
          <div className="relative">
            <select
              id="tts-voice"
              {...register("voiceId")}
              className="w-full appearance-none bg-[#F3F4F6] text-[#0A0A0A] text-sm font-medium px-3.5 py-2.5 pr-8 rounded-xl cursor-pointer border border-transparent hover:border-[#E5E7EB] outline-none focus-visible:outline-[#111111] transition-colors"
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
          <label htmlFor="tts-engine" className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Engine
          </label>
          <div className="relative">
            <select
              id="tts-engine"
              {...register("engine")}
              className="w-full appearance-none bg-[#F3F4F6] text-[#0A0A0A] text-sm font-medium px-3.5 py-2.5 pr-8 rounded-xl cursor-pointer border border-transparent hover:border-[#E5E7EB] outline-none focus-visible:outline-[#111111] transition-colors"
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
            className="btn-pill btn-solid px-6 py-2.5 text-sm self-end"
            style={{ marginTop: "auto" }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="spinner" /> Synthesizing…
              </span>
            ) : (
              "Synthesize"
            )}
          </button>
        </div>
      </div>

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

      {/* Audio player */}
      {audioUrl && <AudioPlayer src={audioUrl} />}
    </form>
  );
}
