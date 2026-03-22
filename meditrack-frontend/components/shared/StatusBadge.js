"use client";

import { Badge } from "@/components/ui/badge";

const MAP = {
  PENDING: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  APPROVED: "bg-green-100 text-green-700 hover:bg-green-100",
  REJECTED: "bg-red-100 text-red-700 hover:bg-red-100",
  FLAGGED: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  "PENDING APPROVAL": "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
};

export default function StatusBadge({ status }) {
  const cls = MAP[status] || "bg-slate-100 text-slate-700 hover:bg-slate-100";
  return (
    <Badge className={`rounded-full border-0 px-[10px] py-[2px] text-[12px] font-medium ${cls}`}>
      {status}
    </Badge>
  );
}

