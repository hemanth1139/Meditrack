"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import usePatients from "@/hooks/usePatients";

export default function PatientSearch({ open, onOpenChange, onSelect }) {
  const { searchPatients } = usePatients();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!q) {
        setResults([]);
        return;
      }
      try {
        setLoading(true);
        const res = await searchPatients(q);
        setResults(res || []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, searchPatients]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-medium">Search Patient</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Search by patient name or ID" value={q} onChange={(e) => setQ(e.target.value)} />
          {loading ? (
            <div className="grid gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : results.length ? (
            <div className="grid gap-2">
              {results.map((p) => (
                <button
                  key={p.patient_id}
                  className="flex items-center justify-between rounded-lg border border-border bg-white p-3 text-left shadow-card hover:bg-slate-50"
                  onClick={() => {
                    onSelect(p);
                    onOpenChange(false);
                  }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-slate-900">
                      {p.user || p.patient_id}
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-slate-500">
                      {p.patient_id} • {p.hospital}
                    </div>
                  </div>
                  <div className="text-[13px] font-medium text-primary">Select</div>
                </button>
              ))}
            </div>
          ) : q ? (
            <EmptyState title="No results" description="Try a different name or patient ID." />
          ) : (
            <div className="text-[14px] text-slate-600">Start typing to search.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

