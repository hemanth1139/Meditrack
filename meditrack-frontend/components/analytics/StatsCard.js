"use client";

import { Card } from "@/components/ui/card";

export default function StatsCard({ title, value, icon, color = "blue", subtitle }) {
  const colorMap = {
    blue: "text-primary bg-primary/10 border-primary/20",
    green: "text-green-700 bg-green-50 border-green-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    red: "text-red-700 bg-red-50 border-red-200",
    slate: "text-slate-700 bg-slate-50 border-slate-200",
  };
  return (
    <Card className="rounded-lg border-border bg-white p-4 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[13px] font-medium text-slate-500">{title}</div>
          <div className="mt-2 text-[24px] font-semibold text-slate-900">{value}</div>
          {subtitle ? (
            <div className="mt-1 text-[14px] text-slate-600">{subtitle}</div>
          ) : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

