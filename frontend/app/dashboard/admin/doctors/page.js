"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2, XCircle, UserCircle2, FileText, ExternalLink,
  Stethoscope, Award, Building2, Phone, Mail, Calendar, Clock
} from "lucide-react";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard, SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

function DetailRow({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <span className={`text-sm text-gray-900 font-medium ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function DoctorDetailModal({ doc, open, onClose, onApprove, onRejectClick }) {
  if (!doc) return null;
  const name = [doc.first_name, doc.last_name].filter(Boolean).join(" ") || doc.email?.split("@")[0] || "Doctor";
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Doctor Application Details"
      footer={
        doc.status === "PENDING" || !doc.is_verified ? (
          <>
            <Button variant="ghost" onClick={onClose}>Close</Button>
            <Button
              variant="danger"
              className="bg-red-50 text-red-600 hover:bg-red-100 border-none"
              onClick={() => { onClose(); onRejectClick(doc); }}
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Reject
            </Button>
            <Button
              variant="success"
              className="bg-green-600 text-white hover:bg-green-700 border-none"
              onClick={() => { onApprove(doc); onClose(); }}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>Close</Button>
        )
      }
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <Avatar name={name} size="lg" className="shrink-0" />
          <div>
            <div className="text-lg font-bold text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">{doc.email}</div>
            {doc.phone && <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Phone className="w-3 h-3" />{doc.phone}</div>}
          </div>
        </div>

        {/* Professional Details */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5" /> Professional Details
          </div>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
            <DetailRow label="Specialization" value={doc.specialization} />
            <DetailRow label="Qualification" value={doc.qualification} />
            <DetailRow label="Department" value={doc.department} />
            <DetailRow label="Medical Council" value={doc.medical_council} />
            <DetailRow label="Reg Number" value={doc.medical_reg_number} mono />
            <DetailRow label="Experience" value={doc.years_of_experience != null ? `${doc.years_of_experience} years` : null} />
          </div>
        </div>

        {/* Hospital */}
        {doc.hospital_name && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="font-medium">Applied for:</span>
            <span>{doc.hospital_name}</span>
          </div>
        )}

        {/* Submitted date */}
        {doc.created_at && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5" />
            Submitted {new Date(doc.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </div>
        )}

        {/* Certificate */}
        <div className="pt-2 border-t border-gray-100">
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> Medical Certificate
          </div>
          {doc.certificate_url ? (
            <a
              href={doc.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors border border-blue-100"
            >
              <FileText className="w-4 h-4" />
              View Certificate Document
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 text-sm font-medium border border-amber-100">
              <FileText className="w-4 h-4" />
              No certificate uploaded
            </div>
          )}
        </div>

        {/* Rejection reason if rejected */}
        {doc.rejection_reason && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Rejection Reason</div>
            <div className="text-sm text-red-700">{doc.rejection_reason}</div>
          </div>
        )}
      </div>
    </Modal>
  );
}

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
        api.get("/users/doctors/pending/").catch(() => ({ data: { data: [] } })),
        api.get("/users/doctors/approved/").catch(() => ({ data: { data: [] } })),
      ]);
      setPending(pRes.data.data?.data || pRes.data.data || []);
      setApproved(aRes.data.data?.data || aRes.data.data || []);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (rejectOpen) setRejectTyped(""); }, [rejectOpen]);

  const approve = async (doc) => {
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

  const openDetails = (doc) => { setSelectedDoctor(doc); setDetailsOpen(true); };

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
        ) : <SkeletonTable />
      ) : activeTab === "pending" ? (
        <div>
          {pending.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="All caught up!" description="There are no pending doctor applications." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pending.map((doc) => {
                const name = [doc.first_name, doc.last_name].filter(Boolean).join(" ") || doc.email?.split("@")[0] || "Doctor";
                return (
                  <Card key={doc.id} className="p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      <Avatar name={name} size="md" className="shrink-0" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{name}</h3>
                        <p className="text-xs text-gray-500 truncate">{doc.email}</p>
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2 space-y-1">
                          <div><span className="font-semibold text-gray-700">Spec:</span> {doc.specialization || "—"}</div>
                          <div><span className="font-semibold text-gray-700">Reg #:</span> <span className="font-mono">{doc.medical_reg_number || "—"}</span></div>
                          <div><span className="font-semibold text-gray-700">Hospital:</span> {doc.hospital_name || "—"}</div>
                          <div className="flex items-center gap-1.5 pt-0.5">
                            {doc.certificate_url ? (
                              <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                                <FileText className="w-3 h-3" /> Certificate uploaded
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                                <FileText className="w-3 h-3" /> No certificate
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        className="text-xs py-1.5 col-span-1 text-gray-600"
                        onClick={() => openDetails(doc)}
                      >
                        Details
                      </Button>
                      <Button
                        variant="danger"
                        className="text-xs py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border-none px-0"
                        onClick={() => { setSelected(doc); setRejectOpen(true); }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                      </Button>
                      <Button
                        variant="success"
                        className="text-xs py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border-none px-0"
                        onClick={() => approve(doc)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
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
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Certificate</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {approved.map((doc) => {
                    const fullName = [doc.first_name, doc.last_name].filter(Boolean).join(" ") || doc.email?.split("@")[0] || "Doctor";
                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-gray-50/80 transition-colors cursor-pointer"
                        onClick={() => openDetails(doc)}
                      >
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
                          {doc.certificate_url ? (
                            <a
                              href={doc.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                            >
                              <FileText className="w-3.5 h-3.5" /> View
                              <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {doc.is_active ? (
                            <Badge variant="green" className="text-[10px] font-bold">Active</Badge>
                          ) : (
                            <Badge variant="red" className="text-[10px] font-bold">Inactive</Badge>
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

      {/* Full Details Modal */}
      <DoctorDetailModal
        doc={selectedDoctor}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onApprove={approve}
        onRejectClick={(doc) => { setSelected(doc); setRejectOpen(true); }}
      />

      {/* Reject Modal */}
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
          <p className="text-sm text-gray-600">Please provide a reason for rejecting this application.</p>
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
            <label className="text-sm font-semibold text-gray-700">Type <span className="font-extrabold font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-900">REJECT</span> to confirm</label>
            <Input value={rejectTyped} onChange={(e) => setRejectTyped(e.target.value)} placeholder="REJECT" className="font-mono text-sm" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
