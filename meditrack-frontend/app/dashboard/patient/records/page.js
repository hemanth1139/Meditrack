"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import RecordTimeline from "@/components/patient/RecordTimeline";
import EmptyState from "@/components/shared/EmptyState";
import useRecords from "@/hooks/useRecords";

export default function PatientRecordsPage() {
  const { records, isLoading } = useRecords();
  const [type, setType] = useState("ALL");

  const approved = (records || []).filter((r) => r.status === "APPROVED");
  const filtered = useMemo(() => {
    const base = [...approved].sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
    if (type === "ALL") return base;
    return base.filter((r) => r.record_type === type);
  }, [approved, type]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-slate-900">My Medical Records</div>
        <div className="mt-1 text-[14px] text-slate-600">Approved records only.</div>
      </div>

      <Card className="rounded-lg border-border bg-white p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <div className="text-[13px] font-medium text-slate-900">Record type</div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {["ALL", "LAB", "SCAN", "PRESCRIPTION", "OTHER"].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="text-[13px] font-medium text-slate-900">Date range</div>
            <div className="text-[14px] text-slate-600">Date range picker UI can be added here.</div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filtered.length ? (
        <RecordTimeline records={filtered} />
      ) : (
        <EmptyState
          title="No records yet"
          description="Once your hospital uploads and approves records, they’ll appear here."
        />
      )}
    </div>
  );
}

