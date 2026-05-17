"use client";

import { useState, FormEvent, KeyboardEvent, useRef } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  function handleCapsLock(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState("CapsLock"));
  }

  function triggerShake() {
    const el = cardRef.current;
    if (!el) return;
    el.classList.add("animate-shake");
    el.addEventListener("animationend", () => {
      el.classList.remove("animate-shake");
    }, { once: true });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);

    if (res.ok) {
      window.location.href = "/";
    } else {
      setError("Invalid username or password");
      triggerShake();
    }
  }

  const inputBase =
    "w-full rounded-lg border bg-gray-900/60 px-4 py-3 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors duration-200";
  const inputIdle = "border-gray-800";
  const inputError = "border-red-500/60";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">

      {/* Ambient glow — top centre (indigo) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }}
      />
      {/* Ambient glow — bottom right (violet) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-1/4 h-72 w-72 rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }}
      />

      {/* ── Card ── */}
      <div
        ref={cardRef}
        className="relative w-full max-w-sm md:max-w-md lg:max-w-lg animate-fade-up rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md"
      >

        {/* ── Branding ── */}
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            L.E.D.G.R.
          </h1>
          <p className="mt-1 text-xs text-gray-400 tracking-wide">
            Ledger for Everyday Dollars &amp; General Records
          </p>
        </div>

        {/* ── Divider ── */}
        <div className="mb-6 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Username */}
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="sr-only">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              autoFocus
              required
              autoComplete="username"
              className={`${inputBase} ${error ? inputError : inputIdle} focus:border-indigo-500`}
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyUp={handleCapsLock}
                required
                autoComplete="current-password"
                className={`${inputBase} ${error ? inputError : inputIdle} pr-11 focus:border-indigo-500`}
              />
              <button
                type="button"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-gray-300"
              >
                {showPw ? (
                  /* eye-off */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.477 10.477A3 3 0 0013.5 13.5M6.343 6.343A9.953 9.953 0 003 12c1.664 4.023 5.6 7 9.5 7a9.95 9.95 0 005.157-1.343M9.878 9.878A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .406-.08.793-.224 1.15M17.657 17.657A9.953 9.953 0 0121 12c-1.664-4.023-5.6-7-9.5-7a9.95 9.95 0 00-3.657.686" />
                  </svg>
                ) : (
                  /* eye */
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {capsLock && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-400">
                <span>⚠</span> Caps Lock is on
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-indigo-500 py-3 text-sm font-medium text-indigo-400 transition-all duration-200 hover:bg-indigo-600 hover:text-white disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>

        </form>
      </div>

      {/* ── Footer ── */}
      <div className="absolute bottom-6 left-1/2 flex w-full max-w-sm -translate-x-1/2 items-center justify-between px-2 text-[10px] uppercase tracking-widest text-gray-600">
        <span>Protego Maxima!</span>
        <span>V.2.0.3</span>
      </div>

    </main>
  );
}
