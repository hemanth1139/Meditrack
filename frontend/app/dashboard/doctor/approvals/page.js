"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import useRecords from "@/hooks/useRecords";
import { formatDate } from "@/lib/utils";

export default function DoctorApprovalsPage() {
  const { records, isLoading, approveRecord, rejectRecord } = useRecords();
  const pending = (records || []).filter((r) => r.status === "PENDING");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = useMemo(() => {
    if (!q) return pending;
    return pending.filter((r) => (r.patient_id || "").toLowerCase().includes(q.toLowerCase()));
  }, [pending, q]);

  const doApprove = async (id) => {
    try {
      await approveRecord(id);
    } catch {}
  };

  const doReject = async () => {
    try {
      await rejectRecord({ id: detail.id, reason: rejectReason });
      setRejectOpen(false);
      setRejectReason("");
    } catch {
      toast.error("Reject failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[24px] font-semibold text-slate-900">
          Pending Approvals{" "}
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-[13px] font-medium text-amber-700">
            {pending.length}
          </span>
        </div>
      </div>

      <Card className="rounded-lg border-border bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <Input placeholder="Search by patient ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      {isLoading ? (
        <div className="grid gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filtered.length ? (
        <Card className="rounded-lg border-border bg-white p-0 shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Record Type</TableHead>
                <TableHead>Visit Date</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.patient_id || "—"}</TableCell>
                  <TableCell>{r.record_type}</TableCell>
                  <TableCell>{formatDate(r.visit_date)}</TableCell>
                  <TableCell>{formatDate(r.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setDetail(r)}>
                        View Details
                      </Button>
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => doApprove(r.id)}>
                        Approve
                      </Button>
                      <Button
                        className="bg-red-600 hover:bg-red-700"
                        onClick={() => {
                          setDetail(r);
                          setRejectOpen(true);
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <EmptyState title="All records reviewed" description="All records reviewed." />
      )}

      <Dialog open={!!detail && !rejectOpen} onOpenChange={(v) => (!v ? setDetail(null) : null)}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-medium">Record Details</DialogTitle>
          </DialogHeader>
          {detail ? (
            <div className="grid gap-2 text-[14px] text-slate-600">
              <div>
                <span className="font-medium text-slate-900">Patient ID:</span> {detail.patient_id}
              </div>
              <div>
                <span className="font-medium text-slate-900">Type:</span> {detail.record_type}
              </div>
              <div>
                <span className="font-medium text-slate-900">Visit date:</span> {formatDate(detail.visit_date)}
              </div>
              <div className="rounded-lg border border-border bg-slate-50 p-3">
                <div className="font-medium text-slate-900">Diagnosis</div>
                <div className="mt-1">{detail.diagnosis}</div>
              </div>
              <div className="rounded-lg border border-border bg-slate-50 p-3">
                <div className="font-medium text-slate-900">Notes</div>
                <div className="mt-1">{detail.notes}</div>
              </div>
              {detail.file ? (
                <Button variant="secondary" onClick={() => window.open(detail.file, "_blank")}>
                  Preview File
                </Button>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-medium">Reject Record</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <label className="text-[13px] font-medium">Rejection reason</label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={doReject}>
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

