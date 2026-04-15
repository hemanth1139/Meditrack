"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SkeletonTable } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Search, Plus, Edit2, MoreVertical, QrCode, Power, Eye } from "lucide-react";
import api from "@/lib/api";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import PatientQRActions from "@/components/interactable/PatientQRActions";


const ROLE_COLORS = {
  ADMIN: "gray",
  HOSPITAL_ADMIN: "purple",
  DOCTOR: "blue",
  STAFF: "amber",
  PATIENT: "green",
};

export default function UsersTable({ initialUsers = [], initialHospitals = [] }) {
  const [items, setItems] = useState(initialUsers);
  const [hospitals, setHospitals] = useState(initialHospitals);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [form, setForm] = useState({
    username: "", email: "", first_name: "", last_name: "", phone: "",
    password: "", role: "PATIENT", hospital_id: "", specialization: "",
  });

  const [qrOpen, setQrOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [deactivateConfirm, setDeactivateConfirm] = useState({ open: false, user: null, loading: false });


  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/?limit=1000");
      setItems(Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialUsers.length) load();
    if (!initialHospitals.length) {
      api.get("/hospitals/").then((r) => {
        setHospitals(Array.isArray(r.data.data) ? r.data.data : r.data.data?.data || []);
      });
    }
  }, [load, initialUsers, initialHospitals]);

  const filteredItems = useMemo(() => {
    return items.filter((u) => {
      const uRole = u.role ? u.role.toUpperCase() : "";
      const matchRole = roleFilter === "ALL" || uRole === roleFilter;
      const term = searchTerm.toLowerCase();
      const matchSearch = term === "" || 
        (u.first_name && u.first_name.toLowerCase().includes(term)) ||
        (u.last_name && u.last_name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term));
      return matchRole && matchSearch;
    });
  }, [items, searchTerm, roleFilter]);

  const openAdd = () => {
    setEditing(null);
    setForm({ username: "", email: "", first_name: "", last_name: "", phone: "", password: "", role: "PATIENT", hospital_id: "", specialization: "" });
    setOpen(true);
  };


  const save = async () => {
    try {
      await api.post("/users/", form);
      toast.success("User created");
      setOpen(false);
      load();
    } catch {
      toast.error("Save failed");
    }

  };

  const toggleStatus = async (user) => {
    try {
      if (!user.is_active) {
        await api.post(`/users/${user.id}/activate/`);
        toast.success("Account activated");
        load();
      }
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  const handleDeactivateConfirm = async () => {
    const user = deactivateConfirm.user;
    if (!user) return;
    setDeactivateConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.post(`/users/${user.id}/deactivate/`, { reason: "Deactivated by Administrator" });
      toast.success("Account deactivated");
      setDeactivateConfirm({ open: false, user: null, loading: false });
      load();
    } catch (err) {
      toast.error("Failed to deactivate account");
      setDeactivateConfirm(prev => ({ ...prev, loading: false }));
    }
  };


  const getHospitalName = (id) => {
    if (!id) return "—";
    const h = hospitals.find((x) => String(x.id) === String(id));
    return h ? h.name : "—";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Users</h1>
           <p className="text-sm text-gray-500 mt-1">Manage global system users</p>
        </div>
        <Button onClick={openAdd} className="gap-2 self-start sm:self-auto shrink-0">
          <Plus className="w-4 h-4" /> Create User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex bg-gray-100 p-1 rounded-full w-full sm:w-auto overflow-x-auto hide-scrollbar">
          {["ALL", "DOCTOR", "STAFF", "PATIENT"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${roleFilter === role ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              {role === "ALL" ? "All" : role.charAt(0) + role.slice(1).toLowerCase() + "s"}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <SkeletonTable rows={5} />
        ) : filteredItems.length === 0 ? (
          <EmptyState icon={Search} title="No users found" description="Try adjusting your search or role filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Specialization</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hospital</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((u) => {
                  const name = (u.first_name && u.last_name && u.first_name === u.last_name)
                    ? u.first_name
                    : [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" name={name} />
                          <div>
                             <div className="text-sm font-semibold text-gray-900">{name}</div>
                             <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={ROLE_COLORS[u.role?.toUpperCase()] || "gray"}>{u.role}</Badge>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        {u.role?.toUpperCase() === "DOCTOR" && u.specialization ? (
                           <span className="text-sm text-gray-600">{u.specialization}</span>
                        ) : (
                           <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {getHospitalName(u.hospital_id)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          {u.is_active ? (
                            <Badge variant="green" className="w-fit font-bold">Active</Badge>
                          ) : (
                            <Badge variant="red" className="w-fit font-bold">Inactive</Badge>
                          )}
                          {u.is_verified && (
                            <span className="text-[10px] font-black text-blue-600 border border-blue-100 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded-md w-fit">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role?.toUpperCase() === "PATIENT" && (
                             <Button 
                              variant="ghost" 
                              size="icon" 
                              className="w-8 h-8 rounded-full text-blue-600 hover:bg-blue-50"
                              onClick={() => { setSelectedPatient(u); setQrOpen(true); }}
                              title="Show QR Code"
                             >
                               <QrCode className="w-4 h-4" />
                             </Button>
                          )}

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`w-8 h-8 rounded-full transition-colors ${u.is_active ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-green-500 hover:text-green-600 hover:bg-green-50"}`}
                            onClick={() => {
                              if (u.is_active) {
                                setDeactivateConfirm({ open: true, user: u, loading: false });
                              } else {
                                toggleStatus(u);
                              }
                            }}
                            title={u.is_active ? "Deactivate Account" : "Activate Account"}
                          >
                             <Power className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal 
        isOpen={open} 
        onClose={() => setOpen(false)} 
        title="Create User Account"

        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Create Account</Button>
          </>

        }
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            <Input label="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            <div className="col-span-2">
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <Input label={editing ? "Password (leave blank to keep)" : "Password"} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-gray-700">Role</label>
              <select className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {Object.keys(ROLE_COLORS).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {form.role === "DOCTOR" && (
              <Input label="Specialization" value={form.specialization || ""} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
            )}
            {["DOCTOR", "STAFF", "HOSPITAL_ADMIN"].includes(form.role) && (
              <div className="col-span-2 flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Hospital ID</label>
                <select className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.hospital_id} onChange={(e) => setForm({ ...form, hospital_id: e.target.value })}>
                  <option value="">Select Hospital</option>
                  {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </Modal>
      
      {/* Patient QR Modal */}
      <Modal 
        isOpen={qrOpen} 
        onClose={() => setQrOpen(false)} 
        title="Patient Identity Card"
      >
        <div className="flex flex-col items-center py-6">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-inner mb-6">
            <PatientQRActions patientId={selectedPatient?.patient_id} />
          </div>
          <div className="w-full space-y-3">
             <div className="flex justify-between items-center py-2 px-4 bg-blue-50/50 rounded-xl border border-blue-100 text-sm">
                <span className="text-gray-500 font-medium">Full Name</span>
                <span className="text-blue-700 font-extrabold">{(selectedPatient?.first_name && selectedPatient?.last_name && selectedPatient.first_name === selectedPatient.last_name) ? selectedPatient.first_name : [selectedPatient?.first_name, selectedPatient?.last_name].filter(Boolean).join(" ")}</span>
             </div>
             <div className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                <span className="text-gray-500 font-medium">Patient ID</span>
                <code className="text-gray-900 font-black tracking-widest">{selectedPatient?.patient_id || "N/A"}</code>
             </div>
          </div>
          <Button variant="outline" className="mt-8 w-full rounded-xl" onClick={() => setQrOpen(false)}>
            Close Card
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deactivateConfirm.open}
        onClose={() => setDeactivateConfirm({ open: false, user: null, loading: false })}
        title="Confirm Deactivation"
        description={`You are about to deactivate the account for ${deactivateConfirm.user?.email || deactivateConfirm.user?.username}. This will block them from accessing the MediTrack system.`}
        confirmText="Deactivate User"
        expectedKeyword="DEACTIVATE"
        onConfirm={handleDeactivateConfirm}
        destructive={true}
        loading={deactivateConfirm.loading}
      />
    </div>
  );
}

