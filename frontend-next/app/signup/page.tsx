"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { getConfig } from "@/lib/config";
import { buildSignupUrl } from "@/lib/auth";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);

  const handleSignUp = () => {
    setLoading(true);
    window.location.href = buildSignupUrl(getConfig());
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6 py-24"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, #EAF1FB 0%, #FFFFFF 70%)",
      }}
    >
      <div
        className="w-full max-w-sm card card-lg p-8 flex flex-col items-center text-center"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}
      >
        <Logo size={30} className="mb-7" />

        <h1 className="text-xl font-bold text-[#0A0A0A] mb-2">
          Create your account
        </h1>
        <p className="text-sm text-[#6B7280] mb-8 leading-relaxed">
          Deploy VoiceBridge in your own AWS account and start converting
          speech in minutes.
        </p>

        <button
          id="create-account-btn"
          onClick={handleSignUp}
          disabled={loading}
          className="btn-pill btn-solid w-full py-3 text-sm mb-4"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="spinner" />
              Redirecting…
            </span>
          ) : (
            "Create Account"
          )}
        </button>

        <p className="text-sm text-[#9CA3AF]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#0A0A0A] font-medium underline underline-offset-2 hover:text-[#374151]"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
