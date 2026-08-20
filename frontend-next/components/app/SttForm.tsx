"use client";

import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sttSchema, type SttFormValues, LANGUAGE_CODES, AUDIO_EXTENSIONS } from "@/lib/schemas";
import { ApiClient, ApiError, type JobStatus } from "@/lib/api";

interface SttFormProps {
  api: ApiClient;
  onJobComplete?: () => void;
}

type Phase =
  | "idle"
  | "uploading"
  | "awaiting_upload"
  | "processing"
  | "completed"
  | "failed";

const STATUS_LABEL: Record<Phase, string> = {
  idle: "",
  uploading: "Uploading…",
  awaiting_upload: "Awaiting upload…",
  processing: "Transcribing…",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_BADGE: Record<Phase, string> = {
  idle: "",
  uploading: "badge-blue",
  awaiting_upload: "badge-yellow",
  processing: "badge-yellow",
  completed: "badge-green",
  failed: "badge-red",
};

export function SttForm({ api, onJobComplete }: SttFormProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SttFormValues>({
    resolver: zodResolver(sttSchema),
    defaultValues: { languageCode: "" },
  });

  const setFile = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setValue("file", file, { shouldValidate: true });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setFile(file);
  };

  const onSubmit = async (values: SttFormValues) => {
    setError(null);
    setTranscript(null);
    setUploadProgress(0);

    try {
      // 1. Get presigned upload URL
      setPhase("uploading");
      const { jobId, uploadUrl } = await api.postSttUpload({
        filename: values.file.name,
        languageCode: values.languageCode || undefined,
      });

      // 2. Upload to S3 via presigned PUT with progress
      await api.putToS3(uploadUrl, values.file, (pct) => setUploadProgress(pct));

      // 3. Poll for job completion
      setPhase("processing");
      const job = await api.pollJob(jobId, {
        onStatus: (s: JobStatus) => {
          if (s === "processing") setPhase("processing");
          if (s === "awaiting_upload") setPhase("awaiting_upload");
        },
      });

      if (job.status === "completed") {
        setPhase("completed");
        setTranscript(job.transcriptText ?? "");
        onJobComplete?.();
      } else {
        setPhase("failed");
        setError(job.errorMessage ?? "Transcription failed. Please try again.");
      }
    } catch (err) {
      setPhase("failed");
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  };

  const handleCopy = async () => {
    if (!transcript) return;
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    reset();
    setSelectedFile(null);
    setPhase("idle");
    setTranscript(null);
    setError(null);
    setUploadProgress(0);
  };

  const isActive = phase !== "idle" && phase !== "completed" && phase !== "failed";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Hidden file input for Zod */}
      <input
        type="file"
        accept={AUDIO_EXTENSIONS.map((e) => `.${e}`).join(",")}
        ref={fileInputRef}
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        aria-label="Audio file upload"
      />

      {/* Dropzone */}
      <div
        className={`relative flex flex-col items-center justify-center min-h-[140px] rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          dragging
            ? "border-[#6B7280] bg-[#F5F6F8]"
            : errors.file
            ? "border-red-300 bg-red-50/30"
            : selectedFile
            ? "border-[#10B981] bg-[#F0FDF4]"
            : "border-[#E5E7EB] hover:border-[#9CA3AF] hover:bg-[#F9FAFB]"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload audio file"
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <svg className="w-8 h-8 text-[#10B981]" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M6 16a10 10 0 1020 0 10 10 0 00-20 0z" fill="#DCFCE7" stroke="#10B981" strokeWidth="1.5"/>
              <path d="M11 16l4 4 6-7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm font-medium text-[#0A0A0A]">{selectedFile.name}</p>
            <p className="text-xs text-[#9CA3AF]">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
              className="text-xs text-[#9CA3AF] hover:text-red-500 underline transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center pointer-events-none">
            <svg className="w-9 h-9 text-[#D1D5DB]" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <path d="M18 8v16M11 15l7-7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 30h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-sm font-medium text-[#6B7280]">
              Drop an audio file, or{" "}
              <span className="text-[#0A0A0A] underline underline-offset-2">browse</span>
            </p>
            <p className="text-xs text-[#9CA3AF]">
              {AUDIO_EXTENSIONS.join(", ")}
            </p>
          </div>
        )}
      </div>
      {errors.file && (
        <p className="text-xs text-red-500 -mt-2">{errors.file.message as string}</p>
      )}

      {/* Upload progress bar */}
      {phase === "uploading" && (
        <div>
          <div className="flex justify-between text-xs text-[#6B7280] mb-1">
            <span>Uploading to S3…</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-1.5 bg-[#E5E7EB] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0A0A0A] rounded-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Language + submit row */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="stt-lang" className="block text-xs font-medium text-[#6B7280] mb-1.5">
            Language
          </label>
          <div className="relative">
            <select
              id="stt-lang"
              {...register("languageCode")}
              className="w-full appearance-none bg-[#F3F4F6] text-[#0A0A0A] text-sm font-medium px-3.5 py-2.5 pr-8 rounded-xl cursor-pointer border border-transparent hover:border-[#E5E7EB] outline-none focus-visible:outline-[#111111] transition-colors"
            >
              {LANGUAGE_CODES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">▾</span>
          </div>
        </div>

        <button
          id="stt-submit-btn"
          type="submit"
          disabled={isSubmitting || isActive || !selectedFile}
          className="btn-pill btn-solid px-6 py-2.5 text-sm"
        >
          {isActive ? (
            <span className="flex items-center gap-2">
              <span className="spinner" /> {STATUS_LABEL[phase]}
            </span>
          ) : (
            "Transcribe"
          )}
        </button>
      </div>

      {/* Status pill */}
      {phase !== "idle" && (
        <div className="flex items-center gap-2">
          <span className={`badge ${STATUS_BADGE[phase]}`}>
            {STATUS_LABEL[phase]}
          </span>
          {(phase === "processing" || phase === "uploading" || phase === "awaiting_upload") && (
            <span className="spinner w-3.5 h-3.5 text-[#9CA3AF]" />
          )}
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

      {/* Transcript card */}
      {phase === "completed" && transcript !== null && (
        <div className="bg-[#F9FAFB] border border-[#EEEEEE] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEEEEE]">
            <span className="text-xs font-semibold text-[#374151]">Transcript</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9CA3AF]">{transcript.split(/\s+/).filter(Boolean).length} words</span>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-pill btn-outline px-3 py-1 text-xs"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
              >
                New
              </button>
            </div>
          </div>
          <div className="px-4 py-4 max-h-60 overflow-y-auto">
            <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">
              {transcript || <span className="text-[#9CA3AF] italic">No transcript returned.</span>}
            </p>
          </div>
        </div>
      )}
    </form>
  );
}
