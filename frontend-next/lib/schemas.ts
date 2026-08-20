// Zod schemas for all form inputs in the authenticated workspace.
// These are imported by react-hook-form via @hookform/resolvers/zod.

import { z } from "zod";

export const POLLY_VOICES = [
  "Joanna",
  "Matthew",
  "Amy",
  "Brian",
  "Lupe",
] as const;

export const POLLY_VOICE_LABELS: Record<(typeof POLLY_VOICES)[number], string> = {
  Joanna: "Joanna (US English)",
  Matthew: "Matthew (US English)",
  Amy: "Amy (British English)",
  Brian: "Brian (British English)",
  Lupe: "Lupe (US Spanish)",
};

export const AUDIO_EXTENSIONS = [
  "mp3",
  "mp4",
  "m4a",
  "wav",
  "flac",
  "ogg",
  "webm",
  "amr",
] as const;

export const LANGUAGE_CODES = [
  { value: "", label: "Auto-detect" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-US", label: "Spanish (US)" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "it-IT", label: "Italian" },
  { value: "pt-BR", label: "Portuguese (BR)" },
  { value: "ja-JP", label: "Japanese" },
  { value: "ko-KR", label: "Korean" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
] as const;

// ── Text to Speech ────────────────────────────────────────────────────────────

export const ttsSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(3000, "Text must be 3,000 characters or fewer"),
  voiceId: z.enum(POLLY_VOICES, { message: "Select a voice" }),
  engine: z.enum(["standard", "neural"] as const, { message: "Select an engine" }),
});

export type TtsFormValues = z.infer<typeof ttsSchema>;

// ── Speech to Text ────────────────────────────────────────────────────────────

function hasAudioExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return AUDIO_EXTENSIONS.some((ext) => lower.endsWith(`.${ext}`));
}

export const sttSchema = z.object({
  file: z
    .instanceof(typeof window !== "undefined" ? File : Object as unknown as typeof File)
    .refine((f) => f instanceof File && f.size > 0, "Choose an audio file")
    .refine(
      (f) => f instanceof File && hasAudioExtension(f.name),
      `Supported formats: ${AUDIO_EXTENSIONS.join(", ")}`
    ),
  languageCode: z.string().optional(),
});

export type SttFormValues = z.infer<typeof sttSchema>;
