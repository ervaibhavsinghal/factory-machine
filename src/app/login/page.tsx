"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("manager");
  const [password, setPassword] = useState("manager123");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
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
          document.cookie = `fm.session=${data.token}; path=/; max-age=43200; SameSite=Lax`;
        } catch {
          // ignore
        }
      }
      const dest =
        data.user.role === "technician"
          ? "/dashboard/maintenance/tickets"
          : "/dashboard";
      window.location.href = dest;
    } catch {
      setError("Something went wrong. Please check your connection.");
      setBusy(false);
    }
  }

  function setDemoCredentials(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setError("");
  }

  return (
    <div className="min-h-screen w-full bg-white text-[#1C2434] antialiased font-sans grid grid-cols-1 lg:grid-cols-2">
      
      {/* LEFT COLUMN: Clean TailAdmin Sign In Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16 max-w-xl mx-auto w-full min-h-screen">
        {/* Top Logo */}
        <div className="pt-2 pb-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#3C50E0] text-white grid place-items-center shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M4 19h4V9H4v10zm6 0h4V5h-4v14zm6 0h4v-7h-4v7z" />
              </svg>
            </div>
            <span className="font-bold text-xl text-[#1C2434] tracking-tight">TailAdmin</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="my-auto py-4">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1C2434] tracking-tight">
              Sign In
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-normal">
              Enter your email and password to sign in!
            </p>
          </div>

          {/* Social Login Buttons matching TailAdmin screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setDemoCredentials("manager", "manager123")}
              className="py-3 px-4 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-slate-100 text-xs sm:text-sm font-medium text-[#1C2434] flex items-center justify-center gap-2.5 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials("tech1", "tech123")}
              className="py-3 px-4 rounded-xl border border-slate-200 bg-[#F8FAFC] hover:bg-slate-100 text-xs sm:text-sm font-medium text-[#1C2434] flex items-center justify-center gap-2.5 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4 fill-[#1C2434] shrink-0" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Sign in with X</span>
            </button>
          </div>

          {/* Quick Role Fill Pills bar */}
          <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg mb-6 border border-slate-100">
            <span className="font-medium text-slate-600">Quick Demo User:</span>
            <div className="flex items-center gap-1.5 font-medium">
              <button
                type="button"
                onClick={() => setDemoCredentials("manager", "manager123")}
                className={`px-2 py-0.5 rounded transition-all ${
                  username === "manager"
                    ? "bg-[#3C50E0] text-white font-bold"
                    : "text-slate-600 hover:text-[#3C50E0]"
                }`}
              >
                Manager
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setDemoCredentials("tech1", "tech123")}
                className={`px-2 py-0.5 rounded transition-all ${
                  username === "tech1"
                    ? "bg-[#3C50E0] text-white font-bold"
                    : "text-slate-600 hover:text-[#3C50E0]"
                }`}
              >
                Technician
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setDemoCredentials("owner", "owner123")}
                className={`px-2 py-0.5 rounded transition-all ${
                  username === "owner"
                    ? "bg-[#3C50E0] text-white font-bold"
                    : "text-slate-600 hover:text-[#3C50E0]"
                }`}
              >
                Owner
              </button>
            </div>
          </div>

          {/* Or Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-full border-t border-slate-200" />
            <span className="bg-white px-4 text-xs text-slate-400 font-normal absolute">Or</span>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="block text-xs font-medium text-[#1C2434] mb-2">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="info@gmail.com"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#1C2434] font-normal placeholder:text-slate-400 focus:outline-none focus:border-[#3C50E0] focus:ring-1 focus:ring-[#3C50E0] transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-[#1C2434] mb-2">
                Password<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#1C2434] font-normal placeholder:text-slate-400 focus:outline-none focus:border-[#3C50E0] focus:ring-1 focus:ring-[#3C50E0] transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox and Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-normal select-none">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#3C50E0] focus:ring-[#3C50E0]"
                />
                <span>Keep me logged in</span>
              </label>

              <Link href="/operator" className="text-[#3C50E0] font-normal hover:underline">
                Forgot password?
              </Link>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#465FFF] hover:bg-[#3B52E8] py-3 text-sm font-medium text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-xs"
            >
              <span>{busy ? "Signing In…" : "Sign In"}</span>
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6 font-normal">
            Don&apos;t have an account?{" "}
            <Link href="/operator" className="text-[#3C50E0] font-normal hover:underline">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-400 py-2">
          &copy; {new Date().getFullYear()} TailAdmin
        </div>
      </div>

      {/* RIGHT COLUMN: TailAdmin Dark Navy Grid Banner */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#0C1427] text-white p-12 relative overflow-hidden min-h-screen">
        {/* Grid Pattern Background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #1E293B 1px, transparent 1px), linear-gradient(to bottom, #1E293B 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#3C50E0]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm space-y-4">
          {/* Logo Box */}
          <div className="w-16 h-16 rounded-2xl bg-[#3C50E0] grid place-items-center text-white shadow-2xl mb-1">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M4 19h4V9H4v10zm6 0h4V5h-4v14zm6 0h4v-7h-4v7z" />
            </svg>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            TailAdmin
          </h2>

          <p className="text-sm text-[#94A3B8] font-normal leading-relaxed max-w-xs">
            Free and Open-Source Tailwind CSS Admin
            <br />
            Dashboard Template
          </p>
        </div>
      </div>

    </div>
  );
}
