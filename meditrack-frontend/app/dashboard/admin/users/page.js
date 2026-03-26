"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import QRCode from "react-qr-code";
import { motion, AnimatePresence } from "framer-motion";

import api from "@/lib/api";

const getInitials = (user) => {
  if (user.first_name || user.last_name) {
    return `${(user.first_name || "")[0] || ""}${(user.last_name || "")[0] || ""}`.toUpperCase();
  }
  if (user.username) return user.username.slice(0, 2).toUpperCase();
  if (user.email) return user.email.slice(0, 2).toUpperCase();
  return "U";
};

import SearchBar from "@/components/shared/SearchBar";
import Pagination from "@/components/shared/Pagination";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [qrOpen, setQrOpen] = useState(false);
  const [qrPatient, setQrPatient] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (selectedHospital) params.hospital_id = selectedHospital;
      if (activeTab !== "all") params.role = activeTab.toUpperCase();
      if (query) params.search = query;

      const res = await api.get("/users/", { params });
      if (res.data.data && typeof res.data.data.total !== "undefined") {
        setUsers(res.data.data.data || []);
        setTotalPages(res.data.data.totalPages || 1);
      } else {
        setUsers(res.data.data || []);
        setTotalPages(1);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [selectedHospital, activeTab, query, page]);

  const loadHospitals = useCallback(async () => {
    try {
      const res = await api.get("/hospitals/");
      setHospitals(res.data.data || []);
    } catch {
      toast.error("Failed to load hospitals");
    }
  }, []);

  useEffect(() => {
    loadHospitals();
  }, [loadHospitals]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = users; // Server-side pagination and filtering is now used

  const openQr = (patient) => {
    setQrPatient(patient);
    setQrOpen(true);
  };

  const closeQr = () => {
    setQrOpen(false);
    setQrPatient(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="text-[22px] font-semibold text-slate-900">Users</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-lg border border-border px-3 py-2 text-sm"
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
          >
            <option value="">All Hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <button
            className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
            onClick={() => {
              setSelectedHospital("");
              setActiveTab("all");
              setQuery("");
              setPage(1);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All" },
            { value: "DOCTOR", label: "Doctors" },
            { value: "STAFF", label: "Staff" },
            { value: "PATIENT", label: "Patients" },
          ].map((tab) => (
            <button
              key={tab.value}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${activeTab === tab.value ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              onClick={() => { setActiveTab(tab.value); setPage(1); }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <SearchBar 
          placeholder="Search by username or email..." 
          defaultValue={query} 
          onSearch={(q) => { setQuery(q); setPage(1); }} 
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-12 w-full rounded-lg bg-slate-200" />
          <div className="h-12 w-full rounded-lg bg-slate-200" />
          <div className="h-12 w-full rounded-lg bg-slate-200" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
          <table className="min-w-[700px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Hospital</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{getInitials(u)}</div>
                        <div>
                          <div className="font-medium text-slate-900">{u.username || `${u.first_name || ""} ${u.last_name || ""}`.trim()}</div>
                          <div className="text-xs text-slate-500">{u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">{u.role}</td>
                    <td className="px-4 py-3">{u.hospital_name || u.hospital?.name || "—"}</td>
                    <td className="px-4 py-3">
                      {u.role === "PATIENT" ? (
                        <button
                          className="rounded-lg bg-slate-700 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
                          onClick={() => openQr({ name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username, patientId: u.patient_id || u.patient?.patient_id || "N/A" })}
                        >
                          QR
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination current={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {qrOpen && qrPatient && <QRModal patient={qrPatient} onClose={closeQr} />}
    </div>
  );
}

function QRModal({ patient, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow || "";
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-80 rounded-2xl bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
        <h2 className="text-lg font-bold mb-2">{patient.name}</h2>
        <p className="text-sm text-gray-500 mb-4">ID: {patient.patientId}</p>
        <div className="mx-auto mb-4">
          <QRCode value={patient.patientId} size={180} />
        </div>
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          onClick={onClose}
        >
          Close
        </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
