"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isLoading, isAuthenticated, email, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <Logo size={28} />
          <span className="spinner w-5 h-5 text-[#9CA3AF]" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Workspace top bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EEEEEE]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/app" aria-label="VoiceBridge workspace">
            <Logo size={22} />
          </Link>
          <div className="flex items-center gap-3">
            {email && (
              <span className="text-xs text-[#9CA3AF] hidden sm:block truncate max-w-[200px]">
                {email}
              </span>
            )}
            <button
              id="workspace-logout-btn"
              type="button"
              onClick={logout}
              className="btn-pill btn-outline px-4 py-1.5 text-xs"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WorkspaceShell>{children}</WorkspaceShell>
    </AuthProvider>
  );
}
