"use client";

import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function DiagnosisChart({ topDiagnoses, isLoading, title = "Top Diagnoses" }) {
  const data = (topDiagnoses || []).map((d) => ({
    name: d.diagnosis || "Unknown",
    value: d.count || 0,
  }));
  const max = Math.max(...data.map(d => d.value), 1);

  return (
    <Card className="rounded-lg border-border bg-white p-4 shadow-card">
      <div className="text-[16px] font-medium text-slate-900">{title}</div>
      <div className="mt-3 overflow-hidden">
        {isLoading ? (
          <div className="h-[320px]"><LoadingSpinner message="Loading chart..." /></div>
        ) : (
          <div className="space-y-4 py-2">
            {data.length ? data.map((d, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{d.name}</span>
                  <span className="text-slate-500">{d.value}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(d.value / max) * 100}%` }} />
                </div>
              </div>
            )) : <p className="text-sm text-slate-500 py-8 text-center">No data available</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

