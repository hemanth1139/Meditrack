"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Search, UserCircle2 } from "lucide-react";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function AdminDoctorsPage() {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTyped, setRejectTyped] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, aRes] = await Promise.all([
        api.get("/users/doctors/pending/").catch(() => ({ data: { data: [] }})),
        api.get("/users/doctors/approved/").catch(() => ({ data: { data: [] }})),
      ]);
      setPending(pRes.data.data?.data || pRes.data.data || []);
      setApproved(aRes.data.data?.data || aRes.data.data || []);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (rejectOpen) setRejectTyped("");
  }, [rejectOpen]);

  const approve = async (doc) => {
    if (!window.confirm(`Approve ${doc.user?.email || "this doctor"}?`)) return;
    try {
      await api.post(`/users/doctors/${doc.id}/approve/`);
      toast.success("Doctor approved");
      load();
    } catch {
      toast.error("Approve failed");
    }
  };

  const reject = async () => {
    if (!selected) return;
    try {
      await api.post(`/users/doctors/${selected.id}/reject/`, { reason: rejectReason });
      toast.success("Doctor rejected");
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch {
      toast.error("Reject failed");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Doctor Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage doctor applications</p>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${activeTab === "pending" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Applications
          {pending.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">{pending.length}</span>}
          {activeTab === "pending" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button
          className={`pb-3 px-4 text-sm font-semibold transition-colors relative ${activeTab === "approved" ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("approved")}
        >
          Approved Doctors
          {activeTab === "approved" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
      </div>

      {loading ? (
        activeTab === "pending" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard /><SkeletonCard /><SkeletonCard />
          </div>
        ) : (
          <SkeletonTable />
        )
      ) : activeTab === "pending" ? (
        <div>
          {pending.length === 0 ? (
             <EmptyState icon={CheckCircle2} title="All caught up!" description="There are no pending doctor applications." />
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {pending.map((doc) => {
                 const name = doc.first_name || doc.last_name ? `${doc.first_name || ''} ${doc.last_name || ''}`.trim() : doc.email?.split('@')[0] || doc.username || "Doctor";
                 return (
                   <Card key={doc.id} className="p-5 flex flex-col gap-4">
                     <div className="flex gap-4">
                       <Avatar name={name} size="md" className="shrink-0" />
                       <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-gray-900 text-sm truncate">{name}</h3>
                          <p className="text-xs text-gray-500 truncate">{doc.email}</p>
                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-md p-2">
                             <div><span className="font-semibold text-gray-700">Spec:</span> {doc.specialization || "General"}</div>
                             <div className="mt-1"><span className="font-semibold text-gray-700">Reg #:</span> {doc.medical_reg_number || "—"}</div>
                          </div>
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-gray-100">
                        <Button variant="danger" className="text-xs py-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-none px-0" onClick={() => { setSelected(doc); setRejectOpen(true); }}>
                          <XCircle className="w-4 h-4 mr-1.5" /> Reject
                        </Button>
                        <Button variant="success" className="text-xs py-1.5 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-none px-0" onClick={() => approve(doc)}>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
                        </Button>
                     </div>
                   </Card>
                 );
               })}
             </div>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {approved.length === 0 ? (
               <div className="p-8"><EmptyState icon={UserCircle2} title="No approved doctors" /></div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Doctor</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Specialization</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reg Number</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hospital</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Account Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {approved.map((doc) => {
                    const fullName = (doc.first_name && doc.last_name && doc.first_name !== doc.last_name)
                      ? `${doc.first_name} ${doc.last_name}`
                      : doc.first_name || doc.last_name || doc.email?.split('@')[0] || doc.username || "Doctor";
                    return (

                      <tr key={doc.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar size="sm" name={fullName} />
                            <div>
                               <div className="text-sm font-semibold text-gray-900">{fullName}</div>
                               <div className="text-xs text-gray-500">{doc.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant="blue">{doc.specialization || "General"}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                          {doc.medical_reg_number || "—"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-600">
                          {doc.hospital_name || "System"}
                        </td>
                        <td className="px-6 py-4">
                          {doc.is_active ? (
                            <Badge variant="green" className="w-fit text-[10px] font-bold">Active</Badge>
                          ) : (
                            <Badge variant="red" className="w-fit text-[10px] font-bold">Inactive</Badge>
                          )}
                        </td>
                      </tr>

                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      <Modal 
        isOpen={rejectOpen} 
        onClose={() => setRejectOpen(false)} 
        title="Reject Doctor Application"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={reject} disabled={!rejectReason.trim() || rejectTyped !== "REJECT"}>Reject Application</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Please provide a reason for rejecting this application. This helps the doctor understand why they were not approved.</p>
          <div className="flex flex-col gap-1.5">
             <label className="text-sm font-semibold text-gray-700">Reason</label>
             <textarea 
               className="w-full rounded-xl border border-gray-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
               value={rejectReason}
               onChange={(e) => setRejectReason(e.target.value)}
               placeholder="E.g. Incomplete verification documents"
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
        </div>
      </Modal>
    </div>
  );
}
