"use client";

import { useRef, useState, useTransition } from "react";
import { uploadDocumentAction } from "@/lib/actions";

export default function DocsUpload({ machineId }: { machineId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await uploadDocumentAction(machineId, formData);
      if ("error" in res) setError(res.error);
      else {
        setNotice(res.message ?? "Document uploaded.");
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} action={submit} className="flex flex-col sm:flex-row gap-3 items-start">
      {error && <div className="text-sm text-red-600">{error}</div>}
      {notice && <div className="text-sm text-emerald-600">{notice}</div>}
      <input
        type="file"
        name="doc"
        accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.zip"
        className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {isPending ? "Uploading…" : "Upload manual / doc"}
      </button>
    </form>
  );
}
