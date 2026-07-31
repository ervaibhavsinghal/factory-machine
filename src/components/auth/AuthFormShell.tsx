"use client";

import React from "react";

interface AuthFormShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export default function AuthFormShell({
  title,
  subtitle,
  children,
}: AuthFormShellProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in-up">
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold tracking-tight text-brand-heading">
          {title}
        </h1>
        <p className="text-sm text-brand-subtext font-normal">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
}
