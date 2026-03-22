import { Skeleton } from "@/components/ui/skeleton";

/** Reusable dashboard stat card skeletons */
export function StatsCardSkeleton({ count = 4 }) {
  return (
    <div className={`grid grid-cols-2 gap-4 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-card space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a generic list/table of items */
export function ListSkeleton({ rows = 5 }) {
  return (
    <div className="rounded-lg border border-border bg-white p-4 shadow-card space-y-3">
      <Skeleton className="h-6 w-40 mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for chart cards */
export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-card space-y-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-[200px] w-full rounded-lg" />
    </div>
  );
}

/** Skeleton for the full doctor/staff dashboard layout */
export function DashboardPageSkeleton({ statCount = 4 }) {
  return (
    <div className="space-y-6">
      <StatsCardSkeleton count={statCount} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      <ListSkeleton rows={5} />
    </div>
  );
}

/** Skeleton for a patient profile page */
export function PatientProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-card flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      {/* Info grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-4 shadow-card space-y-3">
          <Skeleton className="h-5 w-28 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-white p-4 shadow-card space-y-3">
          <Skeleton className="h-5 w-28 mb-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
      {/* Records list */}
      <ListSkeleton rows={4} />
    </div>
  );
}
