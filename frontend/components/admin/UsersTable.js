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
import { Search, Plus, Edit2, MoreVertical, QrCode } from "lucide-react";
import api from "@/lib/api";

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

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      username: u.username || "", email: u.email || "", first_name: u.first_name || "", last_name: u.last_name || "",
      phone: u.phone || "", password: "", role: u.role || "PATIENT", hospital_id: u.hospital_id || "", specialization: u.specialization || "",
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editing.id}/`, payload);
        toast.success("User updated");
      } else {
        await api.post("/users/", form);
        toast.success("User created");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Save failed");
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
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Verified</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map((u) => {
                  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username;
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
                        {u.is_active ? <Badge variant="green">Active</Badge> : <Badge variant="red">Inactive</Badge>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role?.toUpperCase() === "PATIENT" && (
                             <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-blue-600 hover:bg-blue-50">
                               <QrCode className="w-4 h-4" />
                             </Button>
                          )}
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => openEdit(u)}>
                             <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                             <MoreVertical className="w-4 h-4" />
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
        title={editing ? "Edit User" : "Create User"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save User</Button>
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
    </div>
  );
}
