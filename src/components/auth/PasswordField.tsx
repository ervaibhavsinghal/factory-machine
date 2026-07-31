"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export default function PasswordField({
  label,
  id,
  error,
  required,
  className = "",
  ...props
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-brand-heading">
        {label}
        {required && <span className="text-brand-error ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          required={required}
          className={`w-full rounded-xl border bg-white px-4 py-3 pr-11 text-sm text-brand-heading font-medium placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/15 transition-all ${
            error ? "border-brand-error focus:border-brand-error focus:ring-brand-error/15" : "border-brand-input-border"
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          title={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-brand-error mt-1">{error}</p>}
    </div>
  );
}
