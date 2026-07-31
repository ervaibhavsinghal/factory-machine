"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Factory,
  Lock,
  User,
  ArrowRight,
  Smartphone,
  AlertCircle,
  KeyRound,
} from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please check your username and password.");
        setBusy(false);
        return;
      }
      if (data.token) {
        try {
          document.cookie = `fm.session=${data.token}; path=/; max-age=43200; SameSite=None; Secure`;
          document.cookie = `fm.session=${data.token}; path=/; max-age=43200; SameSite=Lax`;
        } catch {
          // ignore
        }
      }
      const dest =
        data.user.role === "technician"
          ? "/dashboard/maintenance/tickets"
          : "/dashboard";
      const redirectUrl = data.token ? `${dest}?token=${encodeURIComponent(data.token)}` : dest;
      window.location.href = redirectUrl;
    } catch {
      setError("Something went wrong. Please check your connection.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans antialiased">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 grid place-items-center text-white shadow-lg group-hover:bg-blue-500 transition-colors">
              <Factory className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">Machinify</span>
          </Link>
          <p className="text-xs text-slate-400 font-medium">Factory Machine Operations & Maintenance Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-black text-slate-900">Sign In</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. manager, tech1, owner"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-extrabold text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{busy ? "Authenticating…" : "Sign In"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2 text-center">
            <Link
              href="/operator"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Machine Operator Portal (No login required)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
