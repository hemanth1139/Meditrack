"use client";

import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function DoctorPatientChart({ data, isLoading }) {
  const max = Math.max(...(data || []).map(d => d.patients), 1);

  return (
    <Card className="rounded-lg border-border bg-white p-4 shadow-card">
      <div className="text-[16px] font-medium text-slate-900">Top Doctors</div>
      <div className="mt-3 overflow-hidden">
        {isLoading ? (
          <div className="h-[320px]"><LoadingSpinner message="Loading chart..." /></div>
        ) : (
          <div className="space-y-4 py-2">
            {(data && data.length) ? data.map((d, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700 truncate pr-2">{d.name}</span>
                  <span className="text-slate-500">{d.patients}</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(d.patients / max) * 100}%` }} />
                </div>
              </div>
            )) : <p className="text-sm text-slate-500 py-8 text-center">No data available</p>}
          </div>
        )}
      </div>
    </Card>
  );
}

