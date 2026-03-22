"use client";

import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function DoctorPatientChart({ data, isLoading }) {
  return (
    <Card className="rounded-lg border-border bg-white p-4 shadow-card">
      <div className="text-[16px] font-medium text-slate-900">Top Doctors</div>
      <div className="mt-3 h-[320px] overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading chart..." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data || []} layout="vertical">
              <XAxis type="number" tick={{ fill: "#64748B", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#64748B", fontSize: 12 }} width={120} />
              <Tooltip />
              <Bar dataKey="patients" fill="#2563EB" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

