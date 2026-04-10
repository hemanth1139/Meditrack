import React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  green: "bg-green-50 text-green-700 border-green-200",
  red: "bg-red-50 text-red-700 border-red-200",
  amber: "bg-amber-50 text-amber-700 border-amber-200",
  purple: "bg-purple-50 text-purple-700 border-purple-200",
  gray: "bg-gray-100 text-gray-700 border-gray-200",
};

export function Badge({ className, variant = "gray", children, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        badgeVariants[variant] || badgeVariants.gray,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
