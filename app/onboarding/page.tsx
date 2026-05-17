"use client";

import { useState } from "react";

export default function OnboardingPage() {
  const [loading, setLoading] = useState<"stock" | "manual" | null>(null);
  const [error, setError] = useState("");

  async function handleStock() {
    setLoading("stock");
    setError("");
    const res = await fetch("/api/onboarding/seed", { method: "POST" });
    if (res.ok) {
      window.location.href = "/";
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong");
      setLoading(null);
    }
  }

  async function handleManual() {
    setLoading("manual");
    setError("");
    const res = await fetch("/api/onboarding/seed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skeleton: true }),
    });
    if (res.ok) {
      window.location.href = "/setup?from=onboarding";
    } else {
      setError("Something went wrong");
      setLoading(null);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">

      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }}
      />

      <div className="relative w-full max-w-lg animate-fade-up rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            Welcome to L.E.D.G.R.
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Let&apos;s set up your categories before you start.
          </p>
        </div>

        <div className="mb-6 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

        <div className="flex flex-col gap-4">

          {/* Stock option */}
          <button
            onClick={handleStock}
            disabled={loading !== null}
            className="group flex flex-col gap-1.5 rounded-xl border border-gray-700 bg-gray-900/60 p-5 text-left transition-all duration-200 hover:border-indigo-500/60 hover:bg-gray-800/60 disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <span className="text-base font-medium text-gray-100 group-hover:text-indigo-300 transition-colors">
                {loading === "stock" ? "Setting up…" : "Use stock categories"}
              </span>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-400">
                Recommended
              </span>
            </span>
            <span className="text-xs text-gray-500">
              Loads a sensible default set — Housing, Food, Transport, Health, Subscriptions, Personal, Savings, and Income — that you can edit later.
            </span>
          </button>

          {/* Manual option */}
          <button
            onClick={handleManual}
            disabled={loading !== null}
            className="group flex flex-col gap-1.5 rounded-xl border border-gray-700 bg-gray-900/60 p-5 text-left transition-all duration-200 hover:border-violet-500/60 hover:bg-gray-800/60 disabled:opacity-50"
          >
            <span className="text-base font-medium text-gray-100 group-hover:text-violet-300 transition-colors">
              {loading === "manual" ? "Going to setup…" : "Set up myself"}
            </span>
            <span className="text-xs text-gray-500">
              Seeds the main groups (Housing, Food, Transport, etc.) and lets you add your own sub-categories in Setup.
            </span>
          </button>

        </div>

        {error && (
          <p role="alert" className="mt-4 text-xs text-red-400">{error}</p>
        )}

      </div>
    </main>
  );
}
