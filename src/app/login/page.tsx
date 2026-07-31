"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_META: Record<string, { title: string; sub: string; creds: [string, string] }> = {
  owner: {
    title: "Sign in as Owner",
    sub: "Complete factory & machine visibility",
    creds: ["owner", "owner123"],
  },
  manager: {
    title: "Sign in as Manager",
    sub: "Machines, QR stickers, ticket board & worker PINs",
    creds: ["manager", "manager123"],
  },
  technician: {
    title: "Sign in as Technician",
    sub: "Your assigned maintenance tickets",
    creds: ["tech1", "tech123"],
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<string>(() => {
    const r = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "").get("role");
    return r && ROLE_META[r] ? r : "";
  });
  const meta = role ? ROLE_META[role] : null;
  const [username, setUsername] = useState(meta?.creds[0] ?? "");
  const [password, setPassword] = useState(meta?.creds[1] ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function selectRole(r: string) {
    setRole(r);
    setError("");
    const m = ROLE_META[r];
    if (m) {
      setUsername(m.creds[0]);
      setPassword(m.creds[1]);
    } else {
      setUsername("");
      setPassword("");
    }
    const url = new URL(window.location.href);
    url.searchParams.set("role", r);
    window.history.replaceState({}, "", url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        setBusy(false);
        return;
      }
      const dest =
        data.user.role === "technician"
          ? "/dashboard/maintenance/tickets"
          : "/dashboard";
      router.push(dest);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 text-white mb-8">
          <span className="w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-blue-400 to-blue-600 text-lg">
            ⚙
          </span>
          <span className="text-xl font-bold">Machinify</span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="grid grid-cols-3 gap-2 mb-6 bg-slate-100 rounded-xl p-1.5">
            {Object.keys(ROLE_META).map((r) => (
              <button
                key={r}
                onClick={() => selectRole(r)}
                className={`rounded-lg py-2 text-xs font-semibold capitalize transition-colors ${
                  role === r ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <h1 className="text-xl font-bold">{meta?.title ?? "Sign in"}</h1>
          <p className="text-sm text-slate-500 mb-6">{meta?.sub ?? "Manager, technician or owner access"}</p>

          {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm mb-4">{error}</div>}

          <form onSubmit={submit}>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="block text-sm font-semibold text-slate-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            <a href="/operator" className="font-semibold text-blue-600 hover:underline">
              → Open the machine operator app (no login)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
