"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";

export default function RecordCard({ record, onFlag }) {
  return (
    <Card className="rounded-lg border-border bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[16px] font-medium text-slate-900">{record.record_type}</div>
            <StatusBadge status={record.status} />
            <div className="text-[14px] text-slate-600">{formatDate(record.visit_date)}</div>
          </div>
          <div className="mt-2 text-[14px] text-slate-600">
            <span className="font-medium text-slate-900">Diagnosis:</span>{" "}
            {(record.diagnosis || "").slice(0, 100)}
            {(record.diagnosis || "").length > 100 ? "..." : ""}
          </div>
          <div className="mt-1 text-[14px] text-slate-600">
            <span className="font-medium text-slate-900">Notes:</span>{" "}
            {(record.notes || "").slice(0, 100)}
            {(record.notes || "").length > 100 ? "..." : ""}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {record.file ? (
            <Button variant="secondary" onClick={() => window.open(record.file, "_blank")}>
              View File
            </Button>
          ) : null}
          {onFlag ? (
            <Button variant="secondary" onClick={() => onFlag(record)}>
              Flag Record
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

