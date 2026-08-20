"use client";

import React, { useRef, useEffect, useState } from "react";

interface AudioPlayerProps {
  src: string;
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onEnded = () => setPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      await audio.play();
      setPlaying(true);
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * audio.duration;
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-xl border border-[#EEEEEE] mt-3">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Play/pause */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-[#0A0A0A] text-white hover:bg-[#2a2a2a] active:scale-95 transition-all"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="3.5" height="12" rx="1.5" fill="white"/>
            <rect x="7.5" y="1" width="3.5" height="12" rx="1.5" fill="white"/>
          </svg>
        ) : (
          <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
            <path d="M1 1l9 5.5L1 12V1z" fill="white"/>
          </svg>
        )}
      </button>

      {/* Scrubber */}
      <div
        className="flex-1 h-1.5 bg-[#E5E7EB] rounded-full cursor-pointer relative group"
        onClick={handleScrub}
        role="slider"
        aria-label="Audio progress"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-[#0A0A0A] rounded-full transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#0A0A0A] rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Time */}
      <span className="text-xs text-[#9CA3AF] font-mono flex-shrink-0 w-20 text-right">
        {fmt(currentTime)} / {fmt(duration)}
      </span>

      {/* Download */}
      <a
        href={src}
        download="voicebridge-audio.mp3"
        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-[#F0F0F0] transition-colors text-[#9CA3AF] hover:text-[#6B7280]"
        title="Download audio"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M7 1v8M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </a>
    </div>
  );
}
