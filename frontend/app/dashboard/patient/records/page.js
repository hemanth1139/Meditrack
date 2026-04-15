"use client";

import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import RecordTimeline from "@/components/patient/RecordTimeline";
import EmptyState from "@/components/shared/EmptyState";
import useRecords from "@/hooks/useRecords";

const TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "LAB_DIAGNOSTICS", label: "Lab & Diagnostics" },
  { value: "PROCEDURE_EMERGENCY", label: "Procedure / Emergency" },
];

export default function PatientRecordsPage() {
  const { records, isLoading } = useRecords();
  const [type, setType] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const approved = (records || []).filter((r) => r.status === "APPROVED");

  const filtered = useMemo(() => {
    let base = [...approved].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
    if (type !== "ALL") base = base.filter((r) => r.visit_type === type);
    if (dateFrom) base = base.filter((r) => new Date(r.visit_date) >= new Date(dateFrom));
    if (dateTo) base = base.filter((r) => new Date(r.visit_date) <= new Date(dateTo));
    return base;
  }, [approved, type, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[24px] font-semibold text-slate-900">My Medical Records</h1>
        <p className="mt-1 text-[14px] text-slate-500">Showing approved records only.</p>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-end gap-4">
          {/* Record type */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">Record type</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-slate-50 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-[13px]">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date from */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Date to */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-[12px] font-medium text-slate-500 uppercase tracking-wide">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] text-slate-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            />
          </div>

          {/* Clear filters */}
          {(type !== "ALL" || dateFrom || dateTo) && (
            <button
              onClick={() => { setType("ALL"); setDateFrom(""); setDateTo(""); }}
              className="h-9 self-end rounded-lg border border-slate-200 bg-slate-50 px-3 text-[12px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              Clear filters
            </button>
          )}

          {/* Result count */}
          <div className="ml-auto self-end text-[13px] text-slate-400">
            {isLoading ? "" : `${filtered.length} record${filtered.length !== 1 ? "s" : ""}`}
          </div>
        </div>
      </div>

      {/* Records list */}
      {isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      ) : filtered.length ? (
        <RecordTimeline records={filtered} />
      ) : (
        <EmptyState
          title="No records yet"
          description="Once your hospital uploads and approves records, they'll appear here."
        />
      )}
    </div>
  );
}

