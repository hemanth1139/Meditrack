import React from "react";
import { cn } from "@/lib/utils";

const pulseClass = "animate-pulse bg-gray-200 rounded";

export function Skeleton({ className, ...props }) {
  return <div className={cn(pulseClass, className)} {...props} />;
}

export function SkeletonText({ className, lines = 1 }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={cn(pulseClass, "h-4 w-full", i === lines - 1 && lines > 1 ? "w-2/3" : "")} 
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ className, size = "md" }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };
  return <div className={cn(pulseClass, "rounded-full shrink-0", sizeClasses[size], className)} />;
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col", className)}>
      <SkeletonAvatar size="md" className="mb-4" />
      <SkeletonText lines={3} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }) {
  return (
    <div className={cn("w-full border border-border rounded-2xl overflow-hidden bg-white", className)}>
      <div className="bg-gray-50 border-b border-border p-4 flex gap-4">
        <div className={cn(pulseClass, "h-4 w-1/4")} />
        <div className={cn(pulseClass, "h-4 w-1/4")} />
        <div className={cn(pulseClass, "h-4 w-1/4")} />
        <div className={cn(pulseClass, "h-4 w-1/4")} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b border-border flex gap-4 items-center last:border-b-0">
          <div className="w-1/4 flex gap-3 items-center">
             <SkeletonAvatar size="sm" />
             <SkeletonText className="w-1/2" />
          </div>
          <SkeletonText className="w-1/4" />
          <SkeletonText className="w-1/4" />
          <SkeletonText className="w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-8 space-y-2">
        <SkeletonText className="w-64 h-8" />
        <SkeletonText className="w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-6">
        <SkeletonTable rows={4} />
      </div>
    </div>
  );
}
