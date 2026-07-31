"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import { assignTechnicianAction } from "@/lib/actions";

export type TechnicianOption = { id: string; name: string };

export default function AssignButton({
  ticketId,
  ticketNo,
  technicians,
  currentAssignedId,
}: {
  ticketId: string;
  ticketNo: string;
  technicians: TechnicianOption[];
  currentAssignedId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function submit(formData: FormData) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await assignTechnicianAction(ticketId, String(formData.get("technicianId") ?? ""));
      if ("error" in res) setError(res.error);
      else {
        setNotice(res.message ?? "Assigned.");
        setTimeout(() => setOpen(false), 600);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
      >
        Approve &amp; Assign
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Approve & assign ${ticketNo}`}
        subtitle="Approving moves the ticket to the technician queue."
      >
        <form action={submit}>
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm mb-3">{error}</div>}
          {notice && <div className="rounded-lg bg-emerald-50 text-emerald-700 px-3 py-2 text-sm mb-3">{notice}</div>}
          <label className="block text-sm font-semibold text-slate-600 mb-1">Assign to technician</label>
          <select
            name="technicianId"
            required
            defaultValue={currentAssignedId || technicians[0]?.id || ""}
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          >
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || technicians.length === 0}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? "Assigning…" : "Assign ticket"}
            </button>
          </div>
          {technicians.length === 0 && (
            <p className="text-xs text-red-600 mt-2">No technicians registered yet.</p>
          )}
        </form>
      </Modal>
    </>
  );
}
