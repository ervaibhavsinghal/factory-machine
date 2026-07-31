"use client";

import React from "react";
import Link from "next/link";
import { Cpu } from "lucide-react";

interface AuthLayoutProps {
  brandName?: string;
  tagline?: string;
  children: React.ReactNode;
}

export default function AuthLayout({
  brandName = "Factory Machine",
  tagline = "Operational intelligence for the modern factory floor.",
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full bg-white text-brand-heading antialiased font-sans grid grid-cols-1 lg:grid-cols-2">
      {/* Left Column: Auth Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:p-16 max-w-xl mx-auto w-full min-h-screen">
        {/* Logo / Header */}
        <div className="pt-2 pb-4">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-brand-indigo text-white grid place-items-center shadow-md shadow-indigo-500/20 group-hover:bg-brand-indigo-hover transition-all">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-brand-heading tracking-tight">
              {brandName}
            </span>
          </Link>
        </div>

        {/* Form area */}
        <div className="my-auto py-6">
          {children}
        </div>

        {/* Footer */}
        <div className="text-xs text-brand-subtext py-2 flex items-center justify-between border-t border-slate-100">
          <span>&copy; {new Date().getFullYear()} {brandName}. All rights reserved.</span>
          <Link href="/" className="hover:text-brand-indigo transition-colors">Home</Link>
        </div>
      </div>

      {/* Right Column: Dark Navy Banner */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-brand-navy-deep text-white p-12 relative overflow-hidden min-h-screen">
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial glow accent */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-indigo/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-md space-y-6">
          {/* Main Logo Card */}
          <div className="w-20 h-20 rounded-2xl bg-brand-indigo grid place-items-center text-white shadow-2xl shadow-indigo-500/30 mb-2 border border-indigo-400/30">
            <Cpu className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {brandName}
          </h2>

          <p className="text-sm text-slate-300 font-normal leading-relaxed max-w-sm">
            {tagline}
          </p>

          <div className="pt-4 flex items-center gap-2 text-xs text-indigo-300/80 bg-indigo-950/60 px-4 py-2 rounded-full border border-indigo-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Industrial IoT & Machine Telemetry Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
