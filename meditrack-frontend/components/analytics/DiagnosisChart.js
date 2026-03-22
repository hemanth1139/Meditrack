"use client";

import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#2563EB", "#16A34A", "#D97706", "#DC2626", "#64748B"];

export default function DiagnosisChart({ topDiagnoses, isLoading, title = "Top Diagnoses" }) {
  const data = (topDiagnoses || []).map((d) => ({
    name: d.diagnosis || "Unknown",
    value: d.count || 0,
  }));

  return (
    <Card className="rounded-lg border-border bg-white p-4 shadow-card">
      <div className="text-[16px] font-medium text-slate-900">{title}</div>
      <div className="mt-3 h-[320px] overflow-hidden">
        {isLoading ? (
          <LoadingSpinner message="Loading chart..." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

