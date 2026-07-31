"use client";

import Modal from "@/components/ui/Modal";

export default function QRModal({
  open,
  onClose,
  dataUrl,
  url,
  machineCode,
  machineId,
}: {
  open: boolean;
  onClose: () => void;
  dataUrl: string;
  url: string;
  machineCode: string;
  machineId: string;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Machine QR sticker" subtitle="Operators scan this sticker to auto-identify the machine.">
      <div className="flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUrl} alt={`QR code for ${machineCode}`} className="w-56 h-56 rounded-xl border border-slate-200" />
        <div className="font-mono text-sm font-bold text-blue-700 mt-3">{machineCode}</div>
        <div className="text-xs text-slate-400 mt-1 break-all text-center">{url}</div>
        <div className="flex gap-3 mt-4 w-full">
          <a
            href={`/api/machines/${machineId}/qr.png`}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white text-center hover:bg-blue-700"
          >
            Download PNG
          </a>
          <button onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
