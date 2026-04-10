import React from "react";
import { cn } from "@/lib/utils";

const iconColors = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
};

export function StatCard({ title, label, value, icon: Icon, color = "blue", className }) {
  return (
    <div className={cn("bg-white border border-border rounded-2xl p-6 shadow-sm shadow-card transition-all duration-200 hover:shadow-hover hover:-translate-y-0.5", className)}>
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-xl flex items-center justify-center shrink-0", iconColors[color] || iconColors.blue)}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title || label}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
        </div>
      </div>
    </div>
  );
}
