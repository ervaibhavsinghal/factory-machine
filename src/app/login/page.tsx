"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Factory,
  Eye,
  EyeOff,
  AlertCircle,
  Wrench,
  UserCheck,
  ShieldCheck,
  Smartphone,
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

  function setDemoCredentials(u: string, p: string) {
    setUsername(u);
    setPassword(p);
    setError("");
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-800 antialiased font-sans grid grid-cols-1 lg:grid-cols-2">
      
      {/* LEFT COLUMN: Clean TailAdmin Sign In Form */}
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16 xl:px-24 max-w-xl mx-auto w-full">
        {/* Top Logo for Mobile & Header */}
        <div className="flex items-center justify-between pb-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#3C50E0] text-white grid place-items-center shadow-xs">
              <Factory className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl text-[#1C2434] tracking-tight">Machinify</span>
          </Link>

          <Link
            href="/operator"
            className="lg:hidden text-xs font-semibold text-[#3C50E0] hover:underline flex items-center gap-1"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Operator App</span>
          </Link>
        </div>

        {/* Form Main Area */}
        <div className="my-auto py-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#1C2434] tracking-tight">
              Sign In
            </h1>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Enter your email and password to sign in!
            </p>
          </div>

          {/* Quick Demo Social Buttons (TailAdmin Google & X style) */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setDemoCredentials("manager", "manager123")}
              className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                username === "manager"
                  ? "border-[#3C50E0] bg-[#3C50E0]/5 text-[#3C50E0] font-semibold"
                  : "border-slate-200 bg-[#F8FAFC] text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-[#3C50E0]" />
              <span>Manager</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials("tech1", "tech123")}
              className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                username === "tech1"
                  ? "border-[#3C50E0] bg-[#3C50E0]/5 text-[#3C50E0] font-semibold"
                  : "border-slate-200 bg-[#F8FAFC] text-slate-600 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-[#3C50E0]" />
              <span>Technician</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials("owner", "owner123")}
              className={`py-2.5 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                username === "owner"
                  ? "border-[#3C50E0] bg-[#3C50E0]/5 text-[#3C50E0] font-semibold"
                  : "border-slate-200 bg-[#F8FAFC] text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#3C50E0]" />
              <span>Owner</span>
            </button>
          </div>

          {/* Or Divider */}
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-full border-t border-slate-200" />
            <span className="bg-white px-3 text-xs text-slate-400 font-medium absolute">Or</span>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 p-3 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Username / Email Input */}
            <div>
              <label className="block text-xs font-medium text-[#1C2434] mb-1.5">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="info@gmail.com"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#1C2434] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#3C50E0] focus:ring-1 focus:ring-[#3C50E0] transition-all"
              />
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-medium text-[#1C2434] mb-1.5">
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
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-[#1C2434] font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#3C50E0] focus:ring-1 focus:ring-[#3C50E0] transition-all pr-11"
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
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium select-none">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#3C50E0] focus:ring-[#3C50E0]"
                />
                <span>Keep me logged in</span>
              </label>

              <Link href="/operator" className="text-[#3C50E0] font-medium hover:underline">
                Operator Portal
              </Link>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[#3C50E0] hover:bg-[#3143C2] py-3 text-sm font-medium text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2 shadow-xs"
            >
              <span>{busy ? "Signing In…" : "Sign In"}</span>
            </button>
          </form>

          <p className="text-xs text-slate-500 text-center mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/operator" className="text-[#3C50E0] font-semibold hover:underline">
              Launch QR Operator App
            </Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-400 py-2">
          &copy; {new Date().getFullYear()} Machinify Maintenance Portal
        </div>
      </div>

      {/* RIGHT COLUMN: TailAdmin Dark Navy Grid Banner */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#0C1427] text-white p-12 relative overflow-hidden">
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
          <div className="w-16 h-16 rounded-2xl bg-[#3C50E0] grid place-items-center text-white shadow-2xl mb-1">
            <Factory className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Machinify
          </h2>

          <p className="text-sm text-[#94A3B8] font-normal leading-relaxed">
            Free and Open-Source Tailwind CSS Admin Dashboard Template
          </p>
        </div>
      </div>

    </div>
  );
}
