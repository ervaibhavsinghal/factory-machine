"use client";

import { useState } from "react";
import QRModal from "@/components/maintenance/QRModal";

export default function QRModalButton({
  id,
  code,
  dataUrl,
  url,
}: {
  id: string;
  code: string;
  dataUrl: string;
  url: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        View QR sticker
      </button>
      <QRModal
        open={open}
        onClose={() => setOpen(false)}
        dataUrl={dataUrl}
        url={url}
        machineCode={code}
        machineId={id}
      />
    </>
  );
}
