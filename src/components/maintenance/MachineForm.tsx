"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createMachineAction, updateMachineAction } from "@/lib/actions";

export type FacilityOption = { id: string; name: string };
export type MachineInitial = {
  id: string;
  code: string;
  name: string;
  model: string;
  facilityId: string;
  locationName: string;
  lat: number;
  lng: number;
  geoRadiusM: number;
  description: string;
};

export default function MachineForm({
  facilities,
  machine,
  onSaved,
}: {
  facilities: FacilityOption[];
  machine?: MachineInitial | null;
  onSaved?: (id?: string) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const isEdit = !!machine;
  const defaultFacility = machine?.facilityId ?? facilities[0]?.id ?? "";

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const res = isEdit ? await updateMachineAction(machine.id, formData) : await createMachineAction(formData);
      if ("error" in res) {
        setError(res.error);
      } else if (onSaved) {
        onSaved(res.id);
      } else if (res.id) {
        router.push(`/dashboard/maintenance/machines/${res.id}`);
      } else {
        router.push("/dashboard/maintenance/machines");
      }
    });
  }

  return (
    <form action={submit} className="space-y-4">
      {error && <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Machine name *</label>
          <input
            type="text"
            name="name"
            required
            defaultValue={machine?.name}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. CNC Milling Machine 01"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">
            Machine code {isEdit ? "" : "(optional)"}
          </label>
          <input
            type="text"
            name="code"
            disabled={isEdit}
            defaultValue={machine?.code}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono disabled:bg-slate-50 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={isEdit ? undefined : "auto-generated if empty"}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Model</label>
          <input
            type="text"
            name="model"
            defaultValue={machine?.model}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. CNC-2000X"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Facility *</label>
          <select
            name="facilityId"
            required
            defaultValue={defaultFacility}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-semibold text-slate-600 mb-1">Location name</label>
          <input
            type="text"
            name="locationName"
            defaultValue={machine?.locationName}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Unit A - Production Floor"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Latitude *</label>
          <input
            type="number"
            step="any"
            name="lat"
            required
            defaultValue={machine?.lat}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Longitude *</label>
          <input
            type="number"
            step="any"
            name="lng"
            required
            defaultValue={machine?.lng}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Geo-fence radius (m)</label>
          <input
            type="number"
            name="geoRadiusM"
            min={10}
            max={5000}
            defaultValue={machine?.geoRadiusM ?? 100}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-1">Description</label>
          <input
            type="text"
            name="description"
            defaultValue={machine?.description}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Operators can only raise tickets when their phone location is within the geo-fence radius of this machine.
      </p>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {isPending ? "Saving…" : isEdit ? "Save changes" : "Register machine"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => onSaved && onSaved()}
            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
