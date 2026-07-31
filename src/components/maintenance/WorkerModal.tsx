"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import { createWorkerAction, updateWorkerAction } from "@/lib/actions";

export type WorkerOption = {
  id: string;
  name: string;
  department: string;
  active: boolean;
  facilityId: string | null;
  createdAt: Date;
};
export type FacilityOption = { id: string; name: string };

export default function WorkerModal({
  open,
  onClose,
  worker,
  facilities,
}: {
  open: boolean;
  onClose: () => void;
  worker?: WorkerOption | null;
  facilities: FacilityOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isEdit = !!worker;

  function submit(formData: FormData) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = isEdit ? await updateWorkerAction(formData) : await createWorkerAction(formData);
      if ("error" in res) setError(res.error);
      else {
        setNotice(res.message ?? (isEdit ? "Worker updated." : "Worker added."));
        setTimeout(() => {
          onClose();
        }, 700);
      }
    });
  }

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit worker — ${worker.name}` : "Add worker"}
      subtitle={
        isEdit
          ? "Reset the 4-digit PIN or update worker details."
          : "Assign a 4-digit PIN the operator uses to verify themselves."
      }
    >
      <form action={submit}>
        <input type="hidden" name="id" value={worker?.id ?? ""} />
        {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm mb-3">{error}</div>}
        {notice && <div className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2 text-sm mb-3">{notice}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">Worker name *</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={worker?.name}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Ramesh Kumar"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Department</label>
              <input
                type="text"
                name="department"
                defaultValue={worker?.department}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1">Facility</label>
              <select
                name="facilityId"
                defaultValue={worker?.facilityId ?? facilities[0]?.id ?? ""}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-1">
              4-digit PIN {isEdit ? "(leave blank to keep current)" : "*"}
            </label>
            <input
              type="tel"
              name="pin"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              required={!isEdit}
              placeholder="••••"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xl tracking-[0.5em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {isEdit && (
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                name="active"
                defaultChecked={worker.active}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Active (can raise tickets)
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? "Saving…" : isEdit ? "Save changes" : "Add worker"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
