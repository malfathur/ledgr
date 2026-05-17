"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function AccountClient({ isAdmin }: { isAdmin: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setMsg({ text: "New passwords do not match", ok: false });
      return;
    }
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMsg({ text: "Password updated", ok: true });
      setCurrent(""); setNext(""); setConfirm("");
    } else {
      setMsg({ text: data.error ?? "Failed to update password", ok: false });
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-white">←</Link>
        <h1 className="text-xl font-semibold">Account</h1>
      </div>

      <section className="rounded-xl bg-gray-900 px-5 py-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Change Password</h2>
        {isAdmin ? (
          <p className="text-sm text-gray-400">
            Admin password is managed via the <code className="text-gray-300">ROOT_PASSWORD</code> environment variable.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Current password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="New password (min 8 chars)"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="rounded-lg bg-gray-800 px-4 py-2.5 text-sm outline-none ring-1 ring-gray-700 focus:ring-indigo-500"
            />
            {msg && (
              <p className={`text-sm ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 py-2.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Update Password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
