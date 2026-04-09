"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import SearchBar from "@/components/shared/SearchBar";
import Pagination from "@/components/shared/Pagination";

const specializationColor = (specialization) => {
  if (!specialization) return "bg-slate-100 text-slate-700";
  const s = specialization.toLowerCase();
  if (s.includes("cardio")) return "bg-red-100 text-red-700";
  if (s.includes("pedia")) return "bg-blue-100 text-blue-700";
  if (s.includes("ortho")) return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
};

export default function AdminDoctorsPage() {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState("");
  const [loading, setLoading] = useState(true);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadHospitals = useCallback(async () => {
    try {
      const res = await api.get("/hospitals/");
      setHospitals(Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || []);
    } catch {
      toast.error("Failed to load hospitals");
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (selectedHospital) params.hospital_id = selectedHospital;
      if (searchTerm) params.search = searchTerm;

      if (activeTab === "pending") {
        const p = await api.get("/users/doctors/pending/", { params });
        setPending(p.data.data?.data || p.data.data || []);
        setTotalPages(p.data.data?.totalPages || 1);
      } else {
        const a = await api.get("/users/doctors/approved/", { params });
        setApproved(a.data.data?.data || a.data.data || []);
        setTotalPages(a.data.data?.totalPages || 1);
      }
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [selectedHospital, activeTab, page, searchTerm]);

  useEffect(() => {
    loadHospitals();
    load();
  }, [loadHospitals, load]);


  const approve = async (doc) => {
    if (!confirm(`Approve ${doc.user?.email || "this doctor"}?`)) return;
    try {
      await api.post(`/users/doctors/${doc.id}/approve/`, { hospital_id: selectedHospital || undefined });
      toast.success("Doctor approved");
      load();
    } catch {
      toast.error("Approve failed");
    }
  };

  const reject = async () => {
    if (!selected) {
      toast.error("No doctor selected");
      return;
    }
    try {
      await api.post(`/users/doctors/${selected.id}/reject/`, {
        reason: rejectReason,
        hospital_id: selectedHospital || undefined,
      });
      toast.success("Doctor rejected");
      setRejectOpen(false);
      setRejectReason("");
      load();
    } catch {
      toast.error("Reject failed");
    }
  };

  const activeItems = useMemo(() => {
    return activeTab === "pending" ? pending : approved;
  }, [activeTab, pending, approved]);

  const filteredItems = activeItems;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] font-semibold text-slate-900">Doctor Approvals</h1>
        <select
          className="rounded-lg border border-border px-3 py-2"
          value={selectedHospital}
          onChange={(e) => { setSelectedHospital(e.target.value); setPage(1); }}
        >
          <option value="">All Hospitals</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <Tabs value={activeTab} onValueChange={(t) => { setActiveTab(t); setPage(1); }}>
          <TabsList className="rounded-full border border-border bg-slate-100 p-1">
            <TabsTrigger value="pending" className="rounded-full px-4 py-2">Pending</TabsTrigger>
            <TabsTrigger value="approved" className="rounded-full px-4 py-2">Approved</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchBar 
            placeholder="Search by name, email, or specialization" 
            defaultValue={searchTerm} 
            onSearch={(q) => { setSearchTerm(q); setPage(1); }} 
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Card className="rounded-lg border-border bg-white shadow-card" style={{minWidth: '640px'}}>
          {loading ? (
            <div className="grid gap-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/5">Doctor</TableHead>
                  <TableHead className="w-1/5">Specialization</TableHead>
                  <TableHead className="w-1/6">REG #</TableHead>
                  <TableHead className="w-1/5">Hospital</TableHead>
                  <TableHead className="w-1/5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                      {activeTab === "pending" ? "No pending doctors found." : "No approved doctors found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((doctor) => (
                    <TableRow key={doctor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-medium text-slate-700">
                            {doctor.user?.username?.slice(0, 2).toUpperCase() || doctor.user?.email?.slice(0, 2).toUpperCase() || "D"}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{doctor.user?.username || doctor.user?.email || "Doctor"}</div>
                            <div className="text-xs text-slate-500">{doctor.user?.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${specializationColor(doctor.specialization)}`}>
                          {doctor.specialization || "General"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                          {doctor.medical_reg_number || "—"}
                        </span>
                      </TableCell>
                      <TableCell>{doctor.hospital_name || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setDetailsOpen(true);
                            }}
                          >
                            View Profile
                          </Button>
                          {activeTab === "pending" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => approve(doctor)}>
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => {
                                  setSelected(doctor);
                                  setRejectOpen(true);
                                }}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <Pagination current={page} totalPages={totalPages} onPageChange={setPage} />
        </Card>
      </div>

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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Doctor Details</DialogTitle>
          </DialogHeader>
          {selectedDoctor ? (
            <div className="space-y-3">
              <div className="text-sm text-slate-700">Email: {selectedDoctor.user?.email}</div>
              <div className="text-sm text-slate-700">Specialization: {selectedDoctor.specialization || "—"}</div>
              <div className="text-sm text-slate-700">Reg #: {selectedDoctor.medical_reg_number || "—"}</div>
              <div className="text-sm text-slate-700">Hospital: {selectedDoctor.hospital_name || "—"}</div>
              <div className="text-sm text-slate-700">Status: {activeTab === "pending" ? "Pending" : "Approved"}</div>
              <div className="flex justify-end">
                <Button onClick={() => setDetailsOpen(false)}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">No doctor selected</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
