"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

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

export default function UsersTable({ initialUsers = [], initialHospitals = [] }) {
  const [users, setUsers] = useState(initialUsers);
  const [hospitals, setHospitals] = useState(initialHospitals);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [loading, setLoading] = useState(!initialUsers.length);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
        setUsers(Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || []);
        setTotalPages(1);
      }
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [selectedHospital, activeTab, query, page]);

  // If initial load passed data, only fetch when filters change
  useEffect(() => {
    // skip initial render if we have initial data and we are at defaults
    if (initialUsers.length > 0 && selectedHospital === "" && activeTab === "all" && query === "" && page === 1) {
      setUsers(initialUsers);
      setLoading(false);
      return; 
    }
    void loadUsers();
  }, [loadUsers, initialUsers.length, selectedHospital, activeTab, query, page]);

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
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination current={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
