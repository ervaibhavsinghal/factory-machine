"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import AuthLayout from "@/components/auth/AuthLayout";
import AuthFormShell from "@/components/auth/AuthFormShell";
import TextField from "@/components/auth/TextField";
import PasswordField from "@/components/auth/PasswordField";
import Checkbox from "@/components/auth/Checkbox";
import PrimaryButton from "@/components/auth/PrimaryButton";

export default function LoginPage() {
  const [email, setEmail] = useState("manager");
  const [password, setPassword] = useState("manager123");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  function setDemoCredentials(u: string, p: string) {
    setEmail(u);
    setPassword(p);
    setError("");
    setFieldErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = "Email or username is required";
    if (!password) errs.password = "Password is required";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your username and password.");
        setLoading(false);
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
        data.user?.role === "technician"
          ? "/dashboard/maintenance/tickets"
          : "/dashboard";
      window.location.href = dest;
    } catch {
      setError("Something went wrong. Please check your network connection.");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      brandName="Factory Machine"
      tagline="Operational intelligence for the modern factory floor."
    >
      <AuthFormShell
        title="Sign In"
        subtitle="Enter your email and password to sign in!"
      >
        <div className="space-y-5">
          {/* Social Quick Login Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDemoCredentials("manager", "manager123")}
              className="py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-brand-heading flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
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
              <span>Manager Login</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials("tech1", "tech123")}
              className="py-2.5 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-brand-heading flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.98]"
            >
              <svg className="w-4 h-4 fill-brand-heading shrink-0" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Technician Login</span>
            </button>
          </div>

          {/* Quick Role Fill Selector */}
          <div className="flex items-center justify-between text-xs text-brand-subtext bg-brand-indigo-soft/60 p-2.5 rounded-xl border border-indigo-100">
            <span className="font-semibold text-brand-indigo">Quick Demo Account:</span>
            <div className="flex items-center gap-1.5 font-medium">
              <button
                type="button"
                onClick={() => setDemoCredentials("manager", "manager123")}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  email === "manager"
                    ? "bg-brand-indigo text-white font-semibold shadow-xs"
                    : "text-brand-heading hover:text-brand-indigo"
                }`}
              >
                Manager
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setDemoCredentials("tech1", "tech123")}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  email === "tech1"
                    ? "bg-brand-indigo text-white font-semibold shadow-xs"
                    : "text-brand-heading hover:text-brand-indigo"
                }`}
              >
                Technician
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setDemoCredentials("owner", "owner123")}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  email === "owner"
                    ? "bg-brand-indigo text-white font-semibold shadow-xs"
                    : "text-brand-heading hover:text-brand-indigo"
                }`}
              >
                Owner
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="w-full border-t border-slate-200" />
            <span className="bg-white px-3 text-xs text-slate-400 font-medium absolute">Or Sign In with Email</span>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 p-3.5 text-xs font-medium flex items-center gap-2.5 animate-fade-in-up">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <TextField
              label="Email or Username"
              id="email"
              name="email"
              type="text"
              required
              placeholder="manager or info@company.com"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
              }}
              error={fieldErrors.email}
            />

            <PasswordField
              label="Password"
              id="password"
              name="password"
              required
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
              }}
              error={fieldErrors.password}
            />

            <div className="flex items-center justify-between pt-1">
              <Checkbox
                id="keepLoggedIn"
                name="keepLoggedIn"
                checked={keepLoggedIn}
                onChange={setKeepLoggedIn}
                label="Keep me logged in"
              />
              <Link
                href="/operator"
                className="text-xs font-semibold text-brand-indigo transition-colors hover:text-brand-indigo-hover hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-2">
              <PrimaryButton loading={loading} type="submit">
                Sign In
              </PrimaryButton>
            </div>
          </form>

          <p className="text-xs text-brand-subtext text-center pt-2 font-normal">
            Need operator mode access?{" "}
            <Link href="/operator" className="text-brand-indigo font-semibold hover:underline">
              Operator Console
            </Link>
          </p>
        </div>
      </AuthFormShell>
    </AuthLayout>
  );
}
