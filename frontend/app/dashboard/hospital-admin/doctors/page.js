"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/lib/auth";
import { Clock, CheckCircle2 } from "lucide-react";

export default function HospitalAdminDoctorsPage() {
  const user = getUser();
  const hospitalId = user?.hospital_id;

  const [activeTab, setActiveTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTyped, setRejectTyped] = useState("");
  const [selected, setSelected] = useState(null);
  
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateTyped, setDeactivateTyped] = useState("");
  const [docToDeactivate, setDocToDeactivate] = useState(null);

  const load = useCallback(async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const [rp, ra] = await Promise.all([
        api.get("/users/doctors/pending/", { params: { hospital_id: hospitalId } }),
        api.get("/users/doctors/approved/", { params: { hospital_id: hospitalId } })
      ]);
      const pendingData = rp.data.data;
      const approvedData = ra.data.data;
      setPending(Array.isArray(pendingData) ? pendingData : pendingData?.data || []);
      setApproved(Array.isArray(approvedData) ? approvedData : approvedData?.data || []);
    } catch (e) {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (rejectOpen) setRejectTyped("");
    if (deactivateOpen) setDeactivateTyped("");
  }, [rejectOpen, deactivateOpen]);

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

  const deactivate = async () => {
    if (!docToDeactivate) return;
    try {
      const res = await api.post(`/users/${docToDeactivate.id}/deactivate/`, { reason: deactivateReason, hospital_id: hospitalId });
      if (res.data.success === false) throw new Error(res.data.message);
      toast.success("Doctor deactivated");
      setDeactivateOpen(false);
      setDeactivateReason("");
      load();
    } catch (e) {
      toast.error(e.message || "Failed to deactivate");
    }
  };

  const activateDoc = async (doc) => {
    try {
      await api.post(`/users/${doc.id}/activate/`, { hospital_id: hospitalId });
      toast.success("Doctor activated");
      load();
    } catch {
      toast.error("Failed to activate doctor");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-[24px] font-semibold text-slate-900">Doctors Management</div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
              activeTab === "pending"
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} /> Optional Pending
            </div>
            {pending.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "pending" ? "bg-white text-blue-600" : "bg-blue-100 text-blue-700"}`}>
                {pending.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
              activeTab === "approved"
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} /> Approved Doctors
            </div>
            {approved.length > 0 && (
               <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "approved" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                 {approved.length}
               </span>
            )}
          </button>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "pending" && (
            <div className="animate-fadeIn">
              {loading ? (
                <div className="grid gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Doctor</TableHead>
                        <TableHead className="font-bold">Specialization</TableHead>
                        <TableHead className="font-bold">Reg #</TableHead>
                        <TableHead className="font-bold">Submitted</TableHead>
                        <TableHead className="text-right font-bold w-1/3">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-slate-500 font-medium">
                            No pending applications right now.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pending.map((d) => (
                          <TableRow key={d.id} className="hover:bg-slate-50">
                            <TableCell className="font-semibold text-slate-900">{[d.first_name, d.last_name].filter(Boolean).join(" ") || d.email || d.username || "—"}</TableCell>
                            <TableCell>{d.specialization || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{d.medical_reg_number || "—"}</TableCell>
                            <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {d.certificate && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(d.certificate, "_blank")}
                                  >
                                    View ID
                                  </Button>
                                )}
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm" onClick={() => approve(d)}>
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {activeTab === "approved" && (
            <div className="animate-fadeIn">
              {loading ? (
                <div className="grid gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Doctor</TableHead>
                        <TableHead className="font-bold">Specialization</TableHead>
                        <TableHead className="font-bold text-center">Patients</TableHead>
                        <TableHead className="font-bold">Approved</TableHead>
                        <TableHead className="text-right font-bold hidden sm:table-cell">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approved.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-slate-500 font-medium">
                            No approved doctors in your hospital.
                          </TableCell>
                        </TableRow>
                      ) : (
                        approved.map((d) => (
                          <TableRow key={d.id} className="hover:bg-slate-50">
                            <TableCell className="font-semibold text-slate-900">{[d.first_name, d.last_name].filter(Boolean).join(" ") || d.email || d.username || "—"}</TableCell>
                            <TableCell>{d.specialization || "—"}</TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                {d.patient_count ?? 0}
                              </span>
                            </TableCell>
                            <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              {d.is_active ? (
                                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { setDocToDeactivate(d); setDeactivateOpen(true); }}>
                                  Deactivate
                                </Button>
                              ) : (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0 shadow-sm" onClick={() => activateDoc(d)}>
                                  Activate
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-2xl p-6 border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Reject Application</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 mt-2">
            <label className="text-sm font-semibold text-slate-700">Reason for Rejection</label>
            <Textarea 
              value={rejectReason} 
              onChange={(e) => setRejectReason(e.target.value)} 
              className="resize-none min-h-[100px] border-slate-200 focus:ring-red-500 focus:border-red-500" 
              placeholder="Explain why the doctor's application is not being approved..." 
            />
          </div>
          <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-gray-100">
             <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg border border-red-100 mb-2">
               This is a sensitive action. Please confirm.
             </div>
             <label className="text-sm font-semibold text-gray-700">Type <span className="font-extrabold select-all tracking-wider font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-900">REJECT</span> to confirm</label>
             <Input 
               value={rejectTyped}
               onChange={(e) => setRejectTyped(e.target.value)}
               placeholder="REJECT"
               className="font-mono text-sm"
             />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" className="border-slate-200" onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={reject} disabled={!rejectReason.trim() || rejectTyped !== "REJECT"}>
              Confirm Rejection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="rounded-2xl p-6 border-slate-200 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">Deactivate Doctor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 mt-2">
            <label className="text-sm font-semibold text-slate-700">Reason for Deactivation</label>
            <Textarea 
              value={deactivateReason} 
              onChange={(e) => setDeactivateReason(e.target.value)} 
              placeholder="Will restrict their access..." 
              className="resize-none min-h-[100px] border-slate-200 focus:ring-red-500 focus:border-red-500" 
            />
          </div>
          <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-gray-100">
             <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg border border-red-100 mb-2">
               This is a sensitive action. Please confirm.
             </div>
             <label className="text-sm font-semibold text-gray-700">Type <span className="font-extrabold select-all tracking-wider font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-900">DEACTIVATE</span> to confirm</label>
             <Input 
               value={deactivateTyped}
               onChange={(e) => setDeactivateTyped(e.target.value)}
               placeholder="DEACTIVATE"
               className="font-mono text-sm"
             />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" className="border-slate-200" onClick={() => setDeactivateOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={deactivate} disabled={!deactivateReason.trim() || deactivateTyped !== "DEACTIVATE"}>
              Deactivate Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
