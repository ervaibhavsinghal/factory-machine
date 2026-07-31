"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  QrCode,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Building2,
  MapPin,
  RefreshCw,
  X,
  FileText,
  ShieldCheck,
  Home,
  Sparkles,
  Zap,
  Wrench,
  Droplet,
  Grid,
} from "lucide-react";

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
  { value: "low", label: "Low", icon: "🟢", color: "border-emerald-200 bg-emerald-50 text-emerald-800 active:bg-emerald-100" },
  { value: "medium", label: "Medium", icon: "🟡", color: "border-amber-200 bg-amber-50 text-amber-800 active:bg-amber-100" },
  { value: "critical", label: "CRITICAL", icon: "🔴", color: "border-red-200 bg-red-50 text-red-800 active:bg-red-100" },
] as const;

const CATEGORIES = [
  { value: "electrical", label: "Electrical", icon: Zap },
  { value: "mechanical", label: "Mechanical", icon: Wrench },
  { value: "hydraulic", label: "Hydraulic", icon: Droplet },
  { value: "other", label: "Other Issue", icon: Grid },
] as const;

const STATUS_STYLE: Record<string, string> = {
  open: "bg-slate-100 text-slate-700 border-slate-200",
  assigned: "bg-indigo-50 text-indigo-700 border-indigo-200",
  accepted: "bg-sky-50 text-sky-700 border-sky-200",
  in_progress: "bg-amber-50 text-amber-800 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
        setMachineError(data.error || "Machine code not found in system.");
        setMachine(null);
      } else {
        setMachine(data.machine);
        setSuccessTicket(null);
      }
    } catch {
      setMachineError("Network error. Please check internet connection.");
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
      setScannerErr("Could not read valid machine code from this QR image.");
    }
  }

  async function openScanner() {
    setScannerErr("");
    setScannerOpen(true);
    const ok = await loadQrLib();
    if (!ok) {
      setScannerErr("Camera scanner library failed to initialize. Type code manually below.");
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
      setScannerErr("Could not open camera. Allow camera permission or enter code manually.");
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
      setGeoError("Location access off. Enable GPS or choose location simulation below.");
    }
  }

  useEffect(() => {
    if (machine) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machine, demoMode]);

  function geoBadge(): { text: string; cls: string } | null {
    if (!machine) return null;
    if (!geo) return { text: "Checking location GPS…", cls: "bg-slate-100 text-slate-600 border-slate-200" };
    const dist = distanceMeters(machine.lat, machine.lng, geo.lat, geo.lng);
    if (dist <= machine.geoRadiusM) {
      return { text: `✓ Location verified (${dist}m from machine)`, cls: "bg-emerald-50 text-emerald-800 border-emerald-200" };
    }
    return {
      text: `Outside plant zone (${dist}m away, max ${machine.geoRadiusM}m)`,
      cls: "bg-red-50 text-red-800 border-red-200",
    };
  }

  /* ---------------- Submit ticket ---------------- */

  async function submitTicket(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!machine) return;
    if (!category) {
      setFormError("Please select an issue category.");
      return;
    }
    if (description.trim().length < 5) {
      setFormError("Please enter a description (at least 5 characters).");
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setFormError("Enter your 4-digit Worker PIN.");
      return;
    }

    setSubmitting(true);
    try {
      let g: Geo;
      try {
        g = await getGeo();
      } catch {
        setFormError("GPS location unavailable. Please enable device location or select demo mode.");
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
        setFormError(data.error || "Could not submit ticket.");
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
      setFormError("Network connection issue. Please try again.");
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
        setStatusError(data.error || "Worker PIN lookup failed.");
        setStatusLookup(null);
      } else {
        setStatusLookup(data);
      }
    } catch {
      setStatusError("Network connection error.");
    } finally {
      setStatusLoading(false);
    }
  }

  const geoBadgeInfo = geoBadge();

  return (
    <div className="min-h-screen bg-slate-50 max-w-md mx-auto flex flex-col pb-16 antialiased font-sans border-x border-slate-200/80 shadow-xs">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 grid place-items-center text-white">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-sm leading-tight text-white">Machinify</div>
            <div className="text-[11px] text-blue-400 font-semibold leading-tight">Machine Operator</div>
          </div>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
      </header>

      {/* Main Tabs */}
      <div className="grid grid-cols-2 bg-white border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTab("raise")}
          className={`py-3 text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
            tab === "raise"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Report Issue</span>
        </button>
        <button
          type="button"
          onClick={() => setTab("status")}
          className={`py-3 text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
            tab === "status"
              ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Tickets</span>
        </button>
      </div>

      {/* ============ TAB: RAISE ISSUE ============ */}
      {tab === "raise" && (
        <div className="p-4 space-y-4">
          {/* Machine Identification Section */}
          {!machine && (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 text-center shadow-xs space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 grid place-items-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-slate-900">Scan Machine QR Sticker</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Point camera at the machine sticker or enter code below.
                </p>
              </div>

              <button
                type="button"
                onClick={openScanner}
                className="w-full rounded-xl bg-blue-600 py-3.5 px-4 text-sm font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                <span>Scan QR Code with Camera</span>
              </button>

              <div className="flex items-center gap-3 my-2 text-[11px] font-semibold text-slate-400">
                <span className="flex-1 h-px bg-slate-200" />
                <span>OR ENTER CODE</span>
                <span className="flex-1 h-px bg-slate-200" />
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
                  placeholder="e.g. M-CNC-001"
                  className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shrink-0"
                >
                  Lookup
                </button>
              </form>

              {machineError && (
                <div className="rounded-xl bg-red-50 text-red-700 border border-red-200 px-3 py-2 text-xs font-medium text-left">
                  {machineError}
                </div>
              )}
              {loadingMachine && (
                <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching machine info…</span>
                </div>
              )}
            </div>
          )}

          {/* Active Machine Card Header */}
          {machine && !loadingMachine && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Machine Verified</span>
                </div>
                <button
                  type="button"
                  onClick={resetMachine}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </div>

              <div>
                <h2 className="font-extrabold text-lg text-slate-900 leading-snug">{machine.name}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {machine.code}
                  </span>
                  {machine.model && <span className="font-medium">Model: {machine.model}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{machine.factory}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{machine.locationName || "Bay"}</span>
                </div>
              </div>

              {geoBadgeInfo && (
                <div
                  className={`rounded-xl px-3 py-2 text-xs font-bold border flex items-center gap-2 ${geoBadgeInfo.cls}`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{geoBadgeInfo.text}</span>
                </div>
              )}
              {geoError && <p className="text-xs font-medium text-amber-700 bg-amber-50 p-2 rounded-lg">{geoError}</p>}
            </div>
          )}

          {/* Form to Report Issue */}
          {machine && !loadingMachine && !successTicket && (
            <form onSubmit={submitTicket} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">
                Report Breakdown / Issue
              </h3>

              {formError && (
                <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Priority Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {URGENCIES.map((u) => (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => setUrgency(u.value)}
                      className={`rounded-xl py-3 px-2 text-xs font-extrabold border transition-all flex flex-col items-center justify-center gap-1 ${
                        urgency === u.value
                          ? `${u.color} ring-2 ring-blue-500`
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-base">{u.icon}</span>
                      <span>{u.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Issue Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const active = category === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategory(c.value)}
                        className={`rounded-xl p-3 text-xs font-bold border transition-all flex items-center gap-2 text-left ${
                          active
                            ? "border-blue-600 bg-blue-50/80 text-blue-800 shadow-2xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-slate-400"}`} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  3. Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what happened e.g. unusual vibration, hydraulic fluid leak, motor stalling..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />
              </div>

              {/* Photo Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  4. Fault Photo (Optional)
                </label>
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
                  className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 px-4 text-xs font-bold text-slate-600 hover:border-blue-500 hover:bg-blue-50/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>{photo ? "Change Fault Photo" : "Take Photo with Phone Camera"}</span>
                </button>
                {photoPreview && (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="Fault preview" className="max-h-48 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhoto(null);
                        if (photoInputRef.current) photoInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 rounded-full bg-slate-900/80 text-white p-1 text-xs hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Worker PIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  5. Worker 4-Digit PIN
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-2xl tracking-[0.5em] text-center font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-blue-600 py-4 text-sm font-extrabold text-white shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting Ticket…</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Submit Maintenance Ticket</span>
                  </>
                )}
              </button>

              {geoNote && <p className="text-[11px] text-slate-400 text-center">{geoNote}</p>}
            </form>
          )}

          {/* Success Screen */}
          {successTicket && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-xs space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 grid place-items-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">Ticket Created Successfully</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manager has been notified and will assign a technician shortly.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-left space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Ticket #</span>
                  <span className="font-mono text-base font-black text-blue-700">{successTicket.ticketNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Machine</span>
                  <span className="text-xs font-bold text-slate-800">{successTicket.machineName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Submitted</span>
                  <span className="text-xs font-semibold text-slate-700">{fmtTime(successTicket.createdAt)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessTicket(null);
                    resetMachine();
                  }}
                  className="flex-1 rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessTicket(null);
                    setUrgency("medium");
                    setCategory("");
                    setDescription("");
                    setPin("");
                    setPhoto(null);
                    setFormError("");
                  }}
                  className="flex-1 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Raise Another Ticket
                </button>
              </div>
            </div>
          )}

          {/* Demo tools */}
          <div className="rounded-2xl border border-dashed border-slate-300 p-3">
            <details className="text-xs text-slate-400">
              <summary className="cursor-pointer font-bold text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>GPS Simulation (For Desktop Testing)</span>
              </summary>
              <div className="mt-2 space-y-2 text-slate-500">
                <p>Simulate location if device has no GPS sensor:</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDemoMode("at");
                      setGeoError("");
                    }}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                      demoMode === "at" ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    At Machine
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoMode("away");
                      setGeoError("");
                    }}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                      demoMode === "away" ? "bg-red-600 text-white" : "bg-red-100 text-red-800"
                    }`}
                  >
                    Away
                  </button>
                </div>
                {demoMode && (
                  <button
                    type="button"
                    onClick={() => setDemoMode(null)}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Reset GPS Mode
                  </button>
                )}
              </div>
            </details>
          </div>
        </div>
      )}

      {/* ============ TAB: MY TICKETS ============ */}
      {tab === "status" && (
        <div className="p-4 space-y-4">
          {!statusLookup ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 grid place-items-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-extrabold text-base text-slate-900">Check Your Raised Tickets</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your 4-digit Worker PIN to view active status.
                </p>
              </div>

              {statusError && (
                <div className="rounded-xl bg-red-50 text-red-700 border border-red-200 px-3 py-2.5 text-xs font-semibold">
                  {statusError}
                </div>
              )}

              <form onSubmit={lookupTickets} className="space-y-3">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={statusPin}
                  onChange={(e) => setStatusPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-2xl tracking-[0.5em] text-center font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
                <button
                  type="submit"
                  disabled={statusLoading || statusPin.length !== 4}
                  className="w-full rounded-xl bg-blue-600 py-3.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {statusLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>View My Tickets</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div>
                  <div className="font-extrabold text-sm text-slate-900">{statusLookup.operator.name}</div>
                  <div className="text-xs text-slate-500">Worker PIN Verified</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStatusLookup(null);
                    setStatusPin("");
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Change PIN
                </button>
              </div>

              {statusLookup.tickets.length === 0 ? (
                <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-xs text-slate-400">
                  No tickets logged under this PIN yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {statusLookup.tickets.map((t) => (
                    <div key={t.id} className="rounded-2xl bg-white border border-slate-200 p-4 shadow-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-black text-blue-700">{t.ticketNo}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                            STATUS_STYLE[t.status] || "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {STATUS_LABEL[t.status] || t.status}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-slate-900">{t.machine.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {t.machine.code} · {fmtTime(t.createdAt)}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-lg">
                        {t.description}
                      </p>
                      {t.resolvedAt && (
                        <div className="text-xs text-emerald-700 font-bold flex items-center gap-1 pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolved at {fmtTime(t.resolvedAt)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============ SCANNER MODAL ============ */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={closeScanner}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Scan Machine QR Code</h3>
              <button type="button" onClick={closeScanner} className="p-1 text-slate-400 hover:text-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">Align camera with machine sticker QR code.</p>
            <div id={scannerDivId} className="w-full overflow-hidden rounded-xl border border-slate-200" />
            {scannerErr && (
              <div className="rounded-xl bg-red-50 text-red-700 p-3 text-xs font-semibold">{scannerErr}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
