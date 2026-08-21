"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ApiClient, type Job } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  completed: "badge-green",
  failed: "badge-red",
  processing: "badge-yellow",
  awaiting_upload: "badge-gray",
};

const TYPE_BADGE: Record<string, string> = {
  tts: "badge-blue",
  stt: "badge-gray",
};

function SkeletonRow() {
  return (
    <tr>
      {[40, 80, 60, 60, 100].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="skeleton h-3 rounded" style={{ width: `${w}%`, maxWidth: w }} />
        </td>
      ))}
    </tr>
  );
}

interface RecentJobsProps {
  api: ApiClient;
  refreshTrigger?: number;
}

export function RecentJobs({ api, refreshTrigger }: RecentJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { jobs: fetched } = await api.getJobs({ limit: 20 });
      setJobs(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchJobs(); }, [fetchJobs, refreshTrigger]);

  const handlePlay = async (audioUrl: string) => {
    const blob = await fetch(audioUrl).then((r) => r.blob());
    const url = URL.createObjectURL(blob);
    setPlayingUrl(url);
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play();
    }
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F0F0F0]">
        <h2 className="text-sm font-semibold text-[#0A0A0A]">Recent Jobs</h2>
        <button
          id="jobs-refresh-btn"
          type="button"
          onClick={fetchJobs}
          disabled={loading}
          className="btn-pill btn-outline px-3 py-1.5 text-xs"
          aria-label="Refresh jobs list"
        >
          {loading ? <span className="spinner text-[#6B7280]" /> : "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Recent jobs">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
              {["Type", "Created", "Status", "Result"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F5F5]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-red-500">
                  {error}
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-[#9CA3AF]">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                      <path d="M16 4a12 12 0 100 24A12 12 0 0016 4z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M16 11v6M16 21h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <p className="text-sm font-medium">No jobs yet</p>
                    <p className="text-xs">Use the playground above to create your first job.</p>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.jobId} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3">
                    <span className={`badge ${TYPE_BADGE[job.type] ?? "badge-gray"}`}>
                      {job.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6B7280] whitespace-nowrap">
                    {fmt(job.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_BADGE[job.status] ?? "badge-gray"}`}>
                      {job.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#374151] max-w-[200px]">
                    {job.type === "tts" && job.audioUrl ? (
                      <button
                        type="button"
                        onClick={() => handlePlay(job.audioUrl!)}
                        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#6B7280] transition-colors font-medium"
                      >
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0A0A0A] text-white flex-shrink-0">
                          <svg width="7" height="8" viewBox="0 0 7 8" fill="none" aria-hidden="true">
                            <path d="M1 1l5 3L1 7V1z" fill="white"/>
                          </svg>
                        </span>
                        Play
                      </button>
                    ) : job.type === "stt" && job.transcriptText ? (
                      <span
                        className="truncate block max-w-[180px]"
                        title={job.transcriptText}
                      >
                        {job.transcriptText.slice(0, 80)}
                        {job.transcriptText.length > 80 ? "…" : ""}
                      </span>
                    ) : job.status === "failed" ? (
                      <span className="text-red-500 truncate block" title={job.errorMessage}>
                        {job.errorMessage ?? "Failed"}
                      </span>
                    ) : (
                      <span className="text-[#D1D5DB]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Hidden audio element for row playback */}
      <audio ref={audioRef} className="hidden" onEnded={() => setPlayingUrl(null)} />
    </div>
  );
}
