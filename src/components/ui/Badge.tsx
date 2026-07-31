import {
  URGENCY_BADGE,
  CATEGORY_BADGE,
  STATUS_BADGE,
  MACHINE_STATUS_BADGE,
  URGENCY_LABELS,
  CATEGORY_LABELS,
  STATUS_LABELS,
  MACHINE_STATUS_LABELS,
} from "@/lib/constants";

type Kind = "urgency" | "category" | "status" | "machineStatus";

const MAPS: Record<Kind, Record<string, string>> = {
  urgency: URGENCY_BADGE,
  category: CATEGORY_BADGE,
  status: STATUS_BADGE,
  machineStatus: MACHINE_STATUS_BADGE,
};

const LABELS: Record<Kind, Record<string, string>> = {
  urgency: URGENCY_LABELS,
  category: CATEGORY_LABELS,
  status: STATUS_LABELS,
  machineStatus: MACHINE_STATUS_LABELS,
};

export function Badge({ kind, value }: { kind: Kind; value: string }) {
  const cls = MAPS[kind][value] ?? "bg-slate-200 text-slate-700";
  const label = LABELS[kind][value] ?? value;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}
