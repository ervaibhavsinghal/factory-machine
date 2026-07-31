"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import { acceptTicketAction, startTicketAction, resolveTicketAction } from "@/lib/actions";

export default function TechActions({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [resolveOpen, setResolveOpen] = useState(false);

  function run(action: Promise<{ ok: boolean; id?: string; message?: string } | { error: string }>) {
    setError("");
    startTransition(async () => {
      const res = await action;
      if ("error" in res) setError(res.error);
      else {
        router.refresh();
        setResolveOpen(false);
      }
    });
  }

  function submitResolution(formData: FormData) {
    setError("");
    startTransition(async () => {
      const res = await resolveTicketAction(ticketId, formData.get("resolution") as string);
      if ("error" in res) setError(res.error);
      else {
        router.refresh();
        setResolveOpen(false);
      }
    });
  }

  return (
    <>
      {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {status === "assigned" && (
          <button
            onClick={() => run(acceptTicketAction(ticketId))}
            disabled={isPending}
            className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isPending ? "…" : "✓ Accept Ticket"}
          </button>
        )}
        {status === "accepted" && (
          <button
            onClick={() => run(startTicketAction(ticketId))}
            disabled={isPending}
            className="rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            {isPending ? "…" : "🔧 Start Repair"}
          </button>
        )}
        {status === "in_progress" && (
          <button
            onClick={() => setResolveOpen(true)}
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            ✅ Mark Resolved
          </button>
        )}
      </div>

      <Modal
        open={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Log the resolution"
        subtitle="Required before closing the ticket — describe what was fixed."
      >
        <form action={submitResolution}>
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm mb-3">{error}</div>}
          <textarea
            name="resolution"
            rows={5}
            required
            minLength={10}
            placeholder="e.g. Replaced the cylinder seal kit, topped up hydraulic oil and pressure-tested. Machine back to normal."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setResolveOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isPending ? "Closing…" : "Mark Resolved"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
