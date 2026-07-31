"use client";

import React from "react";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export default function PrimaryButton({
  loading = false,
  children,
  className = "",
  disabled,
  type = "submit",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`w-full rounded-xl bg-brand-indigo hover:bg-brand-indigo-hover text-white py-3 px-4 text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Signing in...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
