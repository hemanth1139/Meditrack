"use client";

import RecordCard from "@/components/records/RecordCard";
import { formatDate } from "@/lib/utils";

const DOT = {
  CONSULTATION: "bg-blue-600",
  LAB_DIAGNOSTICS: "bg-emerald-600",
  PROCEDURE_EMERGENCY: "bg-red-600",
};

export default function RecordTimeline({ records, onFlag }) {
  return (
    <div className="flex flex-col gap-3 border-l-2 border-slate-100 ml-2 pl-5">
      {records.map((r) => (
        <div key={r.id} className="relative">
          {/* Timeline dot */}
          <div className={`absolute -left-[27px] top-[18px] h-3 w-3 rounded-full border-2 border-white ${DOT[r.visit_type] || "bg-slate-400"}`} />
          {/* Date label */}
          <div className="mb-1 text-[12px] font-medium text-slate-400">{formatDate(r.visit_date)}</div>
          <RecordCard record={r} onFlag={onFlag} />
        </div>
      ))}
    </div>
  );
}

