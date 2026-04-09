"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SearchBar from "@/components/shared/SearchBar";
import Pagination from "@/components/shared/Pagination";

export default function HospitalAdminPatientsPage() {
  const user = getUser();
  const hospitalId = user?.hospital_id;

  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const params = { hospital_id: hospitalId, page, limit: 10 };
      if (query) params.search = query;
      const res = await api.get("/patients/", { params });
      if (res.data.data && typeof res.data.data.total !== "undefined") {
        setPatients(res.data.data.data || []);
        setTotalPages(res.data.data.totalPages || 1);
      } else {
        setPatients(Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || []);
        setTotalPages(1);
      }
    } catch {
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  }, [hospitalId, page, query]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = patients;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[24px] font-semibold text-slate-900">Patients</div>
        <div className="flex items-center gap-2">
          <SearchBar onSearch={(q) => { setQuery(q); setPage(1); }} placeholder="Search by name or patient ID" />
        </div>
      </div>

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
                <TableHead>Name</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Blood Group</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Assigned Doctor</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.patient_id || Math.random()}>
                  <TableCell className="font-medium">{p.user_name || p.name || "—"}</TableCell>
                  <TableCell>{p.patient_id || "—"}</TableCell>
                  <TableCell>{p.date_of_birth ? Math.floor((new Date() - new Date(p.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)) : (p.age || "—")}</TableCell>
                  <TableCell>{p.blood_group || "—"}</TableCell>
                  <TableCell>{new Date(p.registered_at || p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{p.assigned_doctor_name || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="secondary" onClick={() => window.open(`/dashboard/hospital-admin/patients/${p.patient_id}`, "_self")}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination current={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
}
