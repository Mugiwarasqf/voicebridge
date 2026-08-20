"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PlaygroundCard } from "@/components/app/PlaygroundCard";
import { RecentJobs } from "@/components/app/RecentJobs";

export default function WorkspacePage() {
  const { api } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (!api) return null;

  const handleJobComplete = () => setRefreshTrigger((n) => n + 1);

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold text-[#0A0A0A] mb-1">Workspace</h1>
        <p className="text-sm text-[#6B7280]">
          Convert text to speech or transcribe an audio file.
        </p>
      </div>

      {/* Playground card */}
      <PlaygroundCard api={api} onJobComplete={handleJobComplete} />

      {/* Recent jobs */}
      <RecentJobs api={api} refreshTrigger={refreshTrigger} />
    </main>
  );
}
