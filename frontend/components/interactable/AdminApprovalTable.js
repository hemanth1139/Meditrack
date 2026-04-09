"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const EmptyState = ({ message }) => (
  <div className="text-center py-10 text-gray-400">
    <p className="text-sm">{message}</p>
  </div>
);

export default function AdminApprovalTable({ pendingDoctors }) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleApprove = async (doctor) => {
    if (!confirm(`Approve Dr. ${doctor.name}?`)) return;
    setActionLoading(true);
    try {
      await api.post(`/users/doctors/${doctor.id}/approve/`);
      toast.success("Doctor approved");
      router.refresh();
    } catch {
      toast.error("Failed to approve doctor");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      await api.post(`/users/doctors/${rejectTarget.id}/reject/`, { reason: rejectReason });
      toast.success("Doctor rejected");
      setRejectOpen(false);
      setRejectReason("");
      setRejectTarget(null);
      router.refresh();
    } catch {
      toast.error("Failed to reject doctor");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 text-base">Pending Doctor Approvals</h2>
        <Link href="/dashboard/admin/doctors" className="text-sm text-blue-500 hover:underline font-medium">
          View All →
        </Link>
      </div>
      <div className="overflow-x-auto">
        {!pendingDoctors?.length ? (
          <EmptyState message="No pending approvals 🎉" />
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Doctor</th>
                <th className="px-5 py-3 font-medium">Specialization</th>
                <th className="px-5 py-3 font-medium">Hospital</th>
                <th className="px-5 py-3 font-medium">Reg No</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingDoctors.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-800">{d.name}</div>
                    <div className="text-xs text-gray-400">{d.email}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{d.specialization || "—"}</td>
                  <td className="px-5 py-3 text-gray-600">{d.hospital || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">{d.medical_reg_number || "—"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleApprove(d)}
                        className="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => { setRejectTarget(d); setRejectOpen(true); }}
                        className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-gray-800">Reject Doctor</h3>
            <p className="text-sm text-gray-500">Rejecting: <strong>{rejectTarget?.name}</strong></p>
            <textarea
              className="w-full rounded-lg border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              rows={3}
              placeholder="Reason for rejection (optional)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectOpen(false); setRejectTarget(null); setRejectReason(""); }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleReject}
                className="rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
