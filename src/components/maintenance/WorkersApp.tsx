"use client";

import { useState } from "react";
import WorkerModal, { type WorkerOption, type FacilityOption } from "@/components/maintenance/WorkerModal";

export default function WorkersApp({
  workers,
  facilities,
}: {
  workers: WorkerOption[];
  facilities: FacilityOption[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkerOption | null>(null);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workers &amp; PINs</h1>
          <p className="text-sm text-slate-500">
            Machine operators verify themselves with a 4-digit PIN before raising tickets
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add worker
        </button>
      </div>

      {workers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          No workers yet. Add operators and assign them a 4-digit PIN.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="py-3 px-5 font-semibold">Worker</th>
                  <th className="py-3 px-5 font-semibold">Department</th>
                  <th className="py-3 px-5 font-semibold">Facility</th>
                  <th className="py-3 px-5 font-semibold">PIN</th>
                  <th className="py-3 px-5 font-semibold">Status</th>
                  <th className="py-3 px-5 font-semibold">Added</th>
                  <th className="py-3 px-5 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} className="border-b border-slate-50">
                    <td className="py-3 px-5 font-semibold">{w.name}</td>
                    <td className="py-3 px-5 text-slate-500">{w.department || "—"}</td>
                    <td className="py-3 px-5 text-slate-500">
                      {facilities.find((f) => f.id === w.facilityId)?.name ?? "—"}
                    </td>
                    <td className="py-3 px-5 font-mono tracking-widest text-slate-400">••••</td>
                    <td className="py-3 px-5">
                      {w.active ? (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-slate-200 text-slate-600">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-slate-400">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        onClick={() => {
                          setEditing(w);
                          setOpen(true);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Edit / reset PIN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <WorkerModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        worker={editing}
        facilities={facilities}
      />
    </>
  );
}
