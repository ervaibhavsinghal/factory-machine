"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Cache-Control": "no-cache" },
      });
    } catch {
      // ignore
    } finally {
      try {
        document.cookie = "fm.session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        document.cookie = "fm.session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=None; Secure";
      } catch {
        // ignore
      }
      window.location.replace("/login");
    }
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
      title="Sign Out"
    >
      <LogOut className="w-3.5 h-3.5 text-slate-400" />
      <span>{busy ? "…" : "Logout"}</span>
    </button>
  );
}
