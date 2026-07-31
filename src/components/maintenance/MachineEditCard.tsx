"use client";

import { useState } from "react";
import MachineForm, { type FacilityOption, type MachineInitial } from "@/components/maintenance/MachineForm";

export default function MachineEditCard({
  machine,
  facilities,
}: {
  machine: MachineInitial;
  facilities: FacilityOption[];
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
      >
        ✎ Edit details
      </button>
    );
  }

  return (
    <div className="border-t border-slate-100 pt-5">
      <MachineForm facilities={facilities} machine={machine} onSaved={() => setEditing(false)} />
    </div>
  );
}
