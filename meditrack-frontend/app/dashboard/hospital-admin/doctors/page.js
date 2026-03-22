"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/lib/auth";

export default function HospitalAdminDoctorsPage() {
  const user = getUser();
  const hospitalId = user?.hospital_id;

  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const rp = await api.get("/users/doctors/pending/", { params: { hospital_id: hospitalId } });
      const ra = await api.get("/users/doctors/approved/", { params: { hospital_id: hospitalId } });
      setPending(rp.data.data || []);
      setApproved(ra.data.data || []);
    } catch (e) {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (doc) => {
    try {
      await api.post(`/users/doctors/${doc.id}/approve/`, { hospital_id: hospitalId });
      toast.success("Doctor approved");
      load();
    } catch {
      toast.error("Approve failed");
    }
  };

  const reject = async () => {
    if (!selected) return;
    try {
      await api.post(`/users/doctors/${selected.id}/reject/`, { reason: rejectReason, hospital_id: hospitalId });
      toast.success("Doctor rejected");
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch {
      toast.error("Reject failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-[24px] font-semibold text-slate-900">Doctors</div>

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Applications</TabsTrigger>
          <TabsTrigger value="approved">Approved Doctors</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {loading ? (
            <div className="grid gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Card className="rounded-lg border-border bg-white p-0 shadow-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Reg #</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.user?.email || "—"}</TableCell>
                      <TableCell>{d.specialization || "—"}</TableCell>
                      <TableCell>{d.medical_reg_number || "—"}</TableCell>
                      <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {d.certificate && (
                            <Button
                              variant="secondary"
                              onClick={() => window.open(d.certificate, "_blank")}
                            >
                              View Certificate
                            </Button>
                          )}
                          <Button className="bg-green-600 hover:bg-green-700" onClick={() => approve(d)}>
                            Approve
                          </Button>
                          <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                              setSelected(d);
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
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {loading ? (
            <div className="grid gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Card className="rounded-lg border-border bg-white p-0 shadow-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approved.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.user?.email || "—"}</TableCell>
                      <TableCell>{d.specialization || "—"}</TableCell>
                      <TableCell>{d.patient_count ?? "—"}</TableCell>
                      <TableCell>{new Date(d.approved_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button className="bg-red-600 hover:bg-red-700" onClick={async () => {
                          try {
                            await api.post(`/users/${d.user?.id || d.id}/deactivate/`, { hospital_id: hospitalId });
                            toast.success("Doctor deactivated");
                            load();
                          } catch {
                            toast.error("Failed to deactivate");
                          }
                        }}>
                          Deactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-medium">Reject Doctor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <label className="text-[13px] font-medium">Reason</label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={reject}>
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
