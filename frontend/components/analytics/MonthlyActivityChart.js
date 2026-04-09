"use client";

import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function MonthlyActivityChart({ data, isLoading }) {
  const chartData = Object.entries(data || {}).map(([month, count]) => ({ month, count }));
  const max = Math.max(...chartData.map(d => d.count), 1);

  return (
    <Card className="rounded-lg border-border bg-white p-4 shadow-card">
      <div className="text-[16px] font-medium text-slate-900">Monthly Activity</div>
      <div className="mt-3 overflow-hidden">
        {isLoading ? (
          <div className="h-[320px]"><LoadingSpinner message="Loading chart..." /></div>
        ) : (
          <div className="flex h-[280px] items-end gap-2 pb-6 pt-4 px-2">
            {chartData.length ? chartData.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div className="w-full flex justify-center mb-1 h-6 transition-opacity opacity-0 group-hover:opacity-100">
                  <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 rounded">{d.count}</span>
                </div>
                <div className="w-full bg-blue-600 rounded-t-md transition-all hover:bg-blue-500 relative" style={{ height: `${(d.count / max) * 200}px`, minHeight: '4px' }} />
                <div className="w-full text-center mt-2 text-xs font-medium text-slate-500 truncate" title={d.month}>
                  {d.month.substring(0, 3)}
                </div>
              </div>
            )) : <div className="w-full text-sm text-center text-slate-500 self-center">No data available</div>}
          </div>
        )}
      </div>
    </Card>
  );
}

