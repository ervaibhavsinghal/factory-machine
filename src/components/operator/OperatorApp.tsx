"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Machine = {
  code: string;
  name: string;
  model: string;
  factory: string;
  locationName: string;
  description: string;
  lat: number;
  lng: number;
  geoRadiusM: number;
};

type Geo = { lat: number; lng: number; accuracy: number };
type Ticket = {
  id: string;
  ticketNo: string;
  urgency: "low" | "medium" | "critical";
  category: "electrical" | "mechanical" | "hydraulic" | "other";
  description: string;
  photoPath: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  machine: { name: string; code: string };
};

const URGENCIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "critical", label: "CRITICAL" },
] as const;
const CATEGORIES = [
  { value: "electrical", label: "⚡ Electrical" },
  { value: "mechanical", label: "🔩 Mechanical" },
  { value: "hydraulic", label: "💧 Hydraulic" },
  { value: "other", label: "🗂 Other" },
] as const;

const STATUS_STYLE: Record<string, string> = {
  open: "bg-slate-200 text-slate-700",
  assigned: "bg-indigo-100 text-indigo-700",
  accepted: "bg-sky-100 text-sky-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-emerald-100 text-emerald-700",
};
const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  assigned: "Assigned",
  accepted: "Accepted",
  in_progress: "In Progress",
  resolved: "Resolved",
};

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

function fmtTime(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseMachineFromUrl(raw: string): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const m = u.searchParams.get("m");
    if (m) return m;
  } catch {
    /* not a URL — treat as raw code */
  }
  const cleaned = raw.trim().toUpperCase();
  return cleaned.length >= 3 ? cleaned : null;
}

let qrLibPromise: Promise<boolean> | null = null;
function loadQrLib(): Promise<boolean> {
  if (!qrLibPromise) {
    qrLibPromise = new Promise((resolve) => {
      if ((window as unknown as { Html5Qrcode?: unknown }).Html5Qrcode) return resolve(true);
      const s = document.createElement("script");
      s.src = "/vendor/html5-qrcode.min.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  }
  return qrLibPromise;
}

export default function OperatorApp() {
  const [tab, setTab] = useState<"raise" | "status">("raise");
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loadingMachine, setLoadingMachine] = useState(false);
  const [machineError, setMachineError] = useState("");

  const [urgency, setUrgency] = useState<string>("medium");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [pin, setPin] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoError, setGeoError] = useState("");
  const [geoNote, setGeoNote] = useState("");
  const [demoMode, setDemoMode] = useState<"at" | "away" | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successTicket, setSuccessTicket] = useState<{ ticketNo: string; createdAt: string; machineName: string } | null>(null);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerErr, setScannerErr] = useState("");
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const scannerDivId = "operator-qr-reader";

  const [statusPin, setStatusPin] = useState("");
  const [statusLookup, setStatusLookup] = useState<{ operator: { name: string }; tickets: Ticket[] } | null>(null);
  const [statusError, setStatusError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- Machine identification ---------------- */

  const loadMachine = useCallback(async (code: string) => {
    setLoadingMachine(true);
    setMachineError("");
    setFormError("");
    try {
      const res = await fetch(`/api/operator/machines/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        setMachineError(data.error || "Machine not found.");
        setMachine(null);
      } else {
        setMachine(data.machine);
        setSuccessTicket(null);
      }
    } catch {
      setMachineError("Network error. Please try again.");
      setMachine(null);
    } finally {
      setLoadingMachine(false);
    }
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("m");
    if (code) loadMachine(code);
    else {
      const saved = window.localStorage.getItem("op.machine");
      if (saved) loadMachine(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }
    setPhotoPreview(URL.createObjectURL(photo));
    return () => URL.revokeObjectURL(photoPreview);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo]);

  function chooseMachineFromScan(raw: string) {
    const code = parseMachineFromUrl(raw);
    if (code) {
      setScannerErr("");
      loadMachine(code);
      window.localStorage.setItem("op.machine", code);
      setTab("raise");
    } else {
      setScannerErr("Could not read the machine code from this QR.");
    }
  }

  async function openScanner() {
    setScannerErr("");
    setScannerOpen(true);
    const ok = await loadQrLib();
    if (!ok) {
      setScannerErr("Camera scanning is unavailable in this browser. Please enter the machine code manually.");
      return;
    }
    const Html5Qrcode = (window as unknown as {
      Html5Qrcode: new (id: string) => {
        start: (
          config: object,
          configuration: object,
          onSuccess: (text: string) => void,
          onError: (err: unknown) => void
        ) => Promise<void>;
        stop: () => Promise<void>;
      };
    }).Html5Qrcode;
    const scanner = new Html5Qrcode(scannerDivId);
    scannerRef.current = scanner;
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text: string) => {
          scanner.stop().catch(() => {});
          setScannerOpen(false);
          chooseMachineFromScan(text);
        },
        () => {}
      );
    } catch {
      setScannerErr("Could not start the camera. Please allow camera access or enter the machine code manually.");
    }
  }

  function closeScanner() {
    if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    setScannerOpen(false);
  }

  function resetMachine() {
    setMachine(null);
    setSuccessTicket(null);
    setFormError("");
    setGeo(null);
    setGeoError("");
  }

  /* ---------------- Geofence ---------------- */

  async function getGeo(): Promise<Geo> {
    if (machine && demoMode) {
      const lat = demoMode === "at" ? machine.lat : machine.lat + 0.02;
      const lng = demoMode === "at" ? machine.lng : machine.lng + 0.02;
      return { lat, lng, accuracy: 5 };
    }
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        reject(new Error("geolocation-unavailable"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        () => reject(new Error("geolocation-unavailable")),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  async function locate() {
    setGeoError("");
    setGeoNote("");
    try {
      const g = await getGeo();
      setGeo(g);
    } catch {
      setGeo(null);
      setGeoError("Location unavailable. Enable location access on this device (or use the demo tools below).");
    }
  }

  useEffect(() => {
    if (machine) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machine, demoMode]);

  function geoBadge(): { text: string; cls: string } | null {
    if (!machine) return null;
    if (!geo) return { text: "Checking location…", cls: "bg-slate-100 text-slate-500" };
    const dist = distanceMeters(machine.lat, machine.lng, geo.lat, geo.lng);
    if (dist <= machine.geoRadiusM) {
      return { text: `✓ In zone · ${dist}m from machine`, cls: "bg-emerald-100 text-emerald-700" };
    }
    return {
      text: `Outside zone · ${dist}m away (max ${machine.geoRadiusM}m)`,
      cls: "bg-red-100 text-red-700",
    };
  }

  /* ---------------- Submit ticket ---------------- */

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!machine) return;
    if (!category) {
      setFormError("Please select a category.");
      return;
    }
    if (description.trim().length < 5) {
      setFormError("Please describe the issue (at least 5 characters).");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setFormError("Enter your 4-digit PIN.");
      return;
    }

    setSubmitting(true);
    try {
      let g: Geo;
      try {
        g = await getGeo();
      } catch {
        setFormError("Your location could not be determined. Enable location access (or use demo tools) to raise a ticket.");
        setSubmitting(false);
        return;
      }

      const form = new FormData();
      form.append("machineCode", machine.code);
      form.append("urgency", urgency);
      form.append("category", category);
      form.append("description", description.trim());
      form.append("pin", pin);
      form.append("lat", String(g.lat));
      form.append("lng", String(g.lng));
      form.append("accuracy", String(g.accuracy));
      if (photo) form.append("photo", photo);

      const res = await fetch("/api/operator/tickets", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Could not submit the ticket.");
        if (data.reason === "location_unavailable") setGeoError("Enable location access on this device.");
        setSubmitting(false);
        return;
      }
      setSuccessTicket({
        ticketNo: data.ticket.ticketNo,
        createdAt: data.ticket.createdAt,
        machineName: machine.name,
      });
      setSubmitting(false);
    } catch {
      setFormError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  /* ---------------- My tickets ---------------- */

  async function lookupTickets(e: React.FormEvent) {
    e.preventDefault();
    setStatusError("");
    setStatusLoading(true);
    try {
      const res = await fetch("/api/operator/tickets/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: statusPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusError(data.error || "Lookup failed.");
        setStatusLookup(null);
      } else {
        setStatusLookup(data);
      }
    } catch {
      setStatusError("Network error.");
    } finally {
      setStatusLoading(false);
    }
  }

  /* ---------------- Render ---------------- */

  const geoBadgeInfo = geoBadge();

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto flex flex-col pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center gap-2 sticky top-0 z-40">
        <span className="w-8 h-8 rounded-lg grid place-items-center bg-gradient-to-br from-blue-400 to-blue-600 text-sm">⚙</span>
        <div className="flex-1">
          <div className="font-bold text-sm leading-tight">Machinify</div>
          <div className="text-[11px] text-slate-400 leading-tight">Machine Operator</div>
        </div>
        <a href="/" className="text-xs text-slate-300 hover:text-white">Home</a>
      </header>

      {/* Tabs */}
      <div className="grid grid-cols-2 bg-white border-b border-slate-200">
        <button
          onClick={() => setTab("raise")}
          className={`py-3 text-sm font-semibold ${tab === "raise" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}
        >
          📝 Raise Ticket
        </button>
        <button
          onClick={() => setTab("status")}
          className={`py-3 text-sm font-semibold ${tab === "status" ? "text-blue-600 border-b-2 border-blue-600" : "text-slate-400"}`}
        >
          🗂 My Tickets
        </button>
      </div>

      {/* ============ RAISE TAB ============ */}
      {tab === "raise" && (
        <div className="p-4 space-y-4">
          {/* Identify machine */}
          {!machine && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 text-center shadow-sm">
              <div className="text-4xl">🔍</div>
              <h2 className="font-bold text-lg mt-2">Identify your machine</h2>
              <p className="text-sm text-slate-500 mt-1">
                Scan the QR sticker on the machine with this phone, or type its code.
              </p>
              <button
                onClick={openScanner}
                className="w-full mt-4 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                📷 Scan machine QR sticker
              </button>
              <div className="flex items-center gap-3 my-3 text-xs text-slate-400">
                <span className="flex-1 h-px bg-slate-200" /> or <span className="flex-1 h-px bg-slate-200" />
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = (e.currentTarget.elements.namedItem("code") as HTMLInputElement).value;
                  if (input.trim()) {
                    loadMachine(input.trim());
                    window.localStorage.setItem("op.machine", input.trim());
                  }
                }}
                className="flex gap-2"
              >
                <input
                  name="code"
                  placeholder="Machine code (e.g. M-CNC-001)"
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white">
                  Find
                </button>
              </form>
              {machineError && <p className="text-sm text-red-600 mt-3">{machineError}</p>}
              {loadingMachine && <p className="text-sm text-slate-400 mt-3">Loading machine…</p>}
            </div>
          )}

          {loadingMachine && machine && <p className="text-sm text-slate-400 text-center">Loading machine…</p>}

          {/* Machine card */}
          {machine && !loadingMachine && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">
                  ✓ Machine identified
                </span>
                <button onClick={resetMachine} className="text-xs font-semibold text-blue-600 hover:underline">
                  Change
                </button>
              </div>
              <h2 className="font-bold text-lg mt-2">{machine.name}</h2>
              <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                <div className="font-mono font-bold text-blue-700">{machine.code}</div>
                {machine.model && <div>Model: {machine.model}</div>}
                <div>🏭 {machine.factory}</div>
                {machine.locationName && <div>📍 {machine.locationName}</div>}
              </div>
              {machine.description && <p className="text-xs text-slate-400 mt-2">{machine.description}</p>}
              {geoBadgeInfo && (
                <div className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${geoBadgeInfo.cls}`}>{geoBadgeInfo.text}</div>
              )}
              {geoError && <p className="text-xs text-amber-600 mt-2">{geoError}</p>}
            </div>
          )}

          {/* Ticket form */}
          {machine && !loadingMachine && !successTicket && (
            <form onSubmit={submitTicket} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm space-y-4">
              <h3 className="font-bold">Report the issue</h3>

              {formError && <div className="rounded-xl bg-red-50 text-red-700 px-3 py-2.5 text-sm">{formError}</div>}

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Urgency</label>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 rounded-xl p-1.5">
                  {URGENCIES.map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setUrgency(u.value)}
                      className={`rounded-lg py-2.5 text-xs font-bold transition-colors ${
                        urgency === u.value
                          ? u.value === "low"
                            ? "bg-emerald-600 text-white"
                            : u.value === "medium"
                            ? "bg-amber-500 text-white"
                            : "bg-red-600 text-white"
                          : "text-slate-500"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors ${
                        category === c.value
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Describe the issue</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What's wrong? e.g. unusual noise, leak, error code…"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fault / leak photo</label>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600"
                >
                  📷 {photo ? "Change photo" : "Take or choose a photo"}
                </button>
                {photoPreview && (
                  <div className="relative mt-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Fault preview" className="rounded-xl max-h-48 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        if (photoInputRef.current) photoInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 rounded-full bg-black/60 text-white px-2.5 py-1 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Worker 4-digit PIN</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-xl tracking-[0.6em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit ticket"}
              </button>

              {geoNote && <p className="text-xs text-slate-400">{geoNote}</p>}
            </form>
          )}

          {/* Success */}
          {successTicket && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 grid place-items-center text-3xl">
                ✓
              </div>
              <h2 className="font-bold text-lg mt-4">Ticket submitted</h2>
              <p className="text-sm text-slate-500 mt-1">
                The manager will review it and assign a technician.
              </p>
              <div className="rounded-2xl bg-slate-50 p-4 mt-4">
                <div className="text-xs text-slate-400">Ticket #</div>
                <div className="font-mono text-xl font-extrabold text-blue-700">{successTicket.ticketNo}</div>
                <div className="text-xs text-slate-400 mt-2">Submitted at</div>
                <div className="text-sm font-semibold">{fmtTime(successTicket.createdAt)}</div>
                <div className="text-xs text-slate-400 mt-2">Machine</div>
                <div className="text-sm font-semibold">{successTicket.machineName}</div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => {
                    setSuccessTicket(null);
                    resetMachine();
                  }}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Done
                </button>
                <button
                  onClick={() => {
                    setSuccessTicket(null);
                    setUrgency("medium");
                    setCategory("");
                    setDescription("");
                    setPin("");
                    setPhoto(null);
                    setFormError("");
                  }}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Raise another
                </button>
              </div>
            </div>
          )}

          {/* Demo tools */}
          <div className="rounded-2xl border border-dashed border-slate-300 p-3">
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer font-semibold">Testing tools (demo) — location simulation</summary>
              <div className="mt-2 space-y-2">
                <p>If your device has no GPS, simulate a location to test the geo-fence:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDemoMode("at");
                      setGeoError("");
                    }}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                      demoMode === "at" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    At machine (pass)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoMode("away");
                      setGeoError("");
                    }}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                      demoMode === "away" ? "bg-red-600 text-white" : "bg-red-100 text-red-700"
                    }`}
                  >
                    Away (fail)
                  </button>
                </div>
                {demoMode && (
                  <button
                    onClick={() => setDemoMode(null)}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Use real device location
                  </button>
                )}
              </div>
            </details>
          </div>
        </div>
      )}

      {/* ============ STATUS TAB ============ */}
      {tab === "status" && (
        <div className="p-4 space-y-4">
          {!statusLookup ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold">Check ticket status</h3>
              <p className="text-sm text-slate-500 mb-4">
                Enter your 4-digit worker PIN to see the tickets you raised.
              </p>
              {statusError && <div className="rounded-xl bg-red-50 text-red-700 px-3 py-2.5 text-sm mb-3">{statusError}</div>}
              <form onSubmit={lookupTickets}>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={statusPin}
                  onChange={(e) => setStatusPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-xl tracking-[0.6em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={statusLoading || statusPin.length !== 4}
                  className="w-full mt-3 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {statusLoading ? "Loading…" : "View my tickets"}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{statusLookup.operator.name}</div>
                  <div className="text-xs text-slate-400">Tickets you raised</div>
                </div>
                <button
                  onClick={() => {
                    setStatusLookup(null);
                    setStatusPin("");
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  ← Different PIN
                </button>
              </div>

              {statusLookup.tickets.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-sm text-slate-400">
                  No tickets raised yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {statusLookup.tickets.map((t) => (
                    <div key={t.id} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-blue-700">{t.ticketNo}</span>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[t.status] || "bg-slate-200 text-slate-700"}`}>
                          {STATUS_LABEL[t.status] || t.status}
                        </span>
                      </div>
                      <div className="font-semibold text-sm mt-1.5">{t.machine.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {t.machine.code} · {fmtTime(t.createdAt)}
                      </div>
                      <p className="text-sm text-slate-600 mt-2 line-clamp-2">{t.description}</p>
                      {t.resolvedAt && (
                        <div className="text-xs text-emerald-600 mt-2 font-semibold">
                          Resolved {fmtTime(t.resolvedAt)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============ SCANNER MODAL ============ */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={closeScanner}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm">Scan machine QR sticker</h3>
              <button onClick={closeScanner} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Point the camera at the QR sticker on the machine.</p>
            <div id={scannerDivId} className="w-full overflow-hidden rounded-xl" />
            {scannerErr && <div className="rounded-xl bg-red-50 text-red-700 px-3 py-2.5 text-sm mt-3">{scannerErr}</div>}
            <p className="text-xs text-slate-400 mt-3">
              No camera? Enter the machine code manually on the previous screen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
