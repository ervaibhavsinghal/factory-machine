"use client";

import React from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export default function TextField({
  label,
  id,
  error,
  required,
  className = "",
  ...props
}: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-brand-heading">
        {label}
        {required && <span className="text-brand-error ml-0.5">*</span>}
      </label>
      <input
        id={id}
        required={required}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-brand-heading font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/15 transition-all ${
          error ? "border-brand-error focus:border-brand-error focus:ring-brand-error/15" : "border-brand-input-border"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-brand-error mt-1">{error}</p>}
    </div>
  );
}
