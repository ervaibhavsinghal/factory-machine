"use client";

import React from "react";

interface CheckboxProps {
  id: string;
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export default function Checkbox({
  id,
  name,
  checked,
  onChange,
  label,
}: CheckboxProps) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 text-brand-indigo focus:ring-brand-indigo accent-[#4F46E5] cursor-pointer"
      />
      <span className="text-xs font-medium text-brand-subtext">{label}</span>
    </label>
  );
}
