"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";
import QRScannerModal from "@/components/shared/QRScannerModal";
import { useRouter } from "next/navigation";

export default function DoctorPatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scannerOpen, setScannerOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (query) params.search = query;
      const res = await api.get("/patients/", { params });
      const d = res.data?.data;
      if (d && typeof d.total !== "undefined") {
        setPatients(d.data || []);
        setTotalPages(d.totalPages || 1);
      } else {
        setPatients(Array.isArray(d) ? d : []);
        setTotalPages(1);
      }
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  useEffect(() => { void load(); }, [load]);

  const handleScan = (patientId) => {
    router.push(`/dashboard/doctor/patient/${patientId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[22px] font-semibold text-slate-900">My Patients</h1>
        <button
          onClick={() => setScannerOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2" />
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="white" strokeWidth="2" />
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="white" strokeWidth="2" />
            <path d="M14 14h2v2h-2zM18 14h3M14 18h3M18 18h3M18 21v-3" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Scan QR
        </button>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name, ID or email..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
      />

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Patient ID</th>
                <th className="px-4 py-3">Blood Group</th>
                <th className="px-4 py-3">Hospital</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.filter(p => !!p.patient_id).map((p) => {
                  const name = p.user_name || p.user || p.patient_id;
                  const initials = typeof name === "string" ? name.slice(0, 2).toUpperCase() : "P";
                  return (
                    <tr key={p.patient_id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                            {initials}
                          </div>
                          <span className="font-medium text-slate-800">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.patient_id}</td>
                      <td className="px-4 py-3">{p.blood_group || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">{p.hospital_name || p.hospital || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/doctor/patient/${p.patient_id}`}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  );
}
