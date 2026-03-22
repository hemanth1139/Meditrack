"use client";

import RecordCard from "@/components/records/RecordCard";
import { formatDate } from "@/lib/utils";

const DOT = {
  LAB: "bg-primary",
  SCAN: "bg-purple-600",
  PRESCRIPTION: "bg-green-600",
  OTHER: "bg-slate-400",
};

export default function RecordTimeline({ records, onFlag }) {
  return (
    <div className="flex flex-col gap-4">
      {records.map((r) => (
        <div key={r.id} className="grid grid-cols-[120px_1fr] gap-4">
          <div className="pt-2 text-[14px] text-slate-600">{formatDate(r.visit_date)}</div>
          <div className="relative">
            <div className="absolute left-[-18px] top-4 h-3 w-3 rounded-full" style={{ backgroundColor: undefined }} />
            <div className={`absolute left-[-18px] top-4 h-3 w-3 rounded-full ${DOT[r.record_type] || "bg-slate-400"}`} />
            <RecordCard record={r} onFlag={onFlag} />
          </div>
        </div>
      ))}
    </div>
  );
}

