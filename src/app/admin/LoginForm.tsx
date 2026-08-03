"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword("");
        // Server component re-runs and reads the new cookie.
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Sign in failed.");
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell flex min-h-svh items-center justify-center py-32">
      <div className="w-full max-w-sm">
        <p className="label mb-6">Private</p>
        <h1 className="text-d3 mb-3">Traffic</h1>
        <p className="mb-8 text-[0.9375rem] leading-relaxed text-text-dim">
          {configured
            ? "This page is not linked from anywhere and is excluded from search engines."
            : "Admin is not configured on this deployment. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET to enable it."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="pw" className="label mb-2 block">
              Password
            </label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={password}
              disabled={!configured || busy}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 font-mono text-[0.9375rem] outline-none transition-colors focus-visible:border-[var(--accent)] disabled:opacity-40"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="label leading-relaxed"
              style={{ color: "var(--crit)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!configured || busy || password.length === 0}
            data-cursor="link"
            className="h-11 w-full font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            {busy ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
