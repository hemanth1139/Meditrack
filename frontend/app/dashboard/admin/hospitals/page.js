"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Edit2, Trash2 } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export default function AdminHospitalsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    phone: "",
    email: "",
    admin_first_name: "",
    admin_last_name: "",
    admin_email: "",
    admin_password: "",
    admin_phone: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, hospital: null, loading: false });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/hospitals/");
      setItems(Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || []);
    } catch (e) {
      toast.error("Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", address: "", city: "", state: "", phone: "", email: "", admin_first_name: "", admin_last_name: "", admin_email: "", admin_password: "", admin_phone: "" });
    setOpen(true);
  };

  const openEdit = (h) => {
    setEditing(h);
    setForm({
      name: h.name || "",
      address: h.address || "",
      city: h.city || "",
      state: h.state || "",
      phone: h.phone || "",
      email: h.email || "",
      admin_first_name: "",
      admin_last_name: "",
      admin_email: "",
      admin_password: "",
      admin_phone: "",
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        await api.put(`/hospitals/${editing.id}/`, form);
        toast.success("Hospital updated");
      } else {
        await api.post("/hospitals/", {
          name: form.name,
          address: form.address,
          city: form.city,
          state: form.state,
          phone: form.phone,
          email: form.email,
          hospital_admin: {
            first_name: form.admin_first_name,
            last_name: form.admin_last_name,
            email: form.admin_email,
            password: form.admin_password,
            phone: form.admin_phone,
          },
        });
        toast.success("Hospital created and admin account set up");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Save failed");
    }
  };

  const handleDeleteConfirm = async () => {
    const h = deleteConfirm.hospital;
    if (!h) return;
    setDeleteConfirm(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(`/hospitals/${h.id}/`);
      toast.success("Hospital deleted");
      setDeleteConfirm({ open: false, hospital: null, loading: false });
      load();
    } catch {
      toast.error("Delete failed");
      setDeleteConfirm(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
           <p className="text-sm text-gray-500 mt-1">Manage all registered hospitals</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="w-4 h-4" /> Add Hospital
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
         <Card className="p-12">
            <EmptyState 
              icon={Building2} 
              title="No hospitals found" 
              description="Add a hospital to get started." 
              action={<Button onClick={openAdd}>Add Hospital</Button>} 
            />
         </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((h) => (
            <Card key={h.id} variant="hoverable" className="p-6 flex flex-col justify-between h-auto">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <Badge variant={h.is_active ? "green" : "red"}>{h.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                
                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-1">{h.name}</h3>
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1.5 line-clamp-1">
                  {h.city}{h.state ? `, ${h.state}` : ""}
                </p>
 
                <div className="text-xs font-medium text-gray-400 bg-gray-50 rounded-lg p-2.5 mb-6">
                   Added: {h.created_at ? new Date(h.created_at).toLocaleDateString() : "—"}
                </div>
              </div>
 
              <div className="flex items-center gap-2 mt-auto">
                <Button variant="secondary" onClick={() => openEdit(h)} className="flex-1 gap-2 border-gray-200">
                  <Edit2 className="w-4 h-4" /> Edit
                </Button>
                <Button variant="danger" className="px-3 bg-red-50 text-red-600 hover:bg-red-100 border border-transparent hover:border-transparent transition-colors shadow-none" onClick={() => setDeleteConfirm({ open: true, hospital: h, loading: false })}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
 
      <Modal 
        isOpen={open} 
        onClose={() => setOpen(false)} 
        title={editing ? "Edit Hospital" : "Add Hospital"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save Hospital</Button>
          </>
        }
      >
        <div className="space-y-6 py-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Hospital Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <Input label="Hospital Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="col-span-2">
                 <Input label="Address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </div>
              <Input label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
              <Input label="State" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              <Input label="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
 
          {!editing && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2 border-b border-gray-100 pb-2">Admin Account</h3>
              <p className="text-xs text-gray-500 mb-4">This person will manage this hospital.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={form.admin_first_name} onChange={(e) => setForm((f) => ({ ...f, admin_first_name: e.target.value }))} />
                <Input label="Last Name" value={form.admin_last_name} onChange={(e) => setForm((f) => ({ ...f, admin_last_name: e.target.value }))} />
                <div className="col-span-2">
                  <Input label="Email" type="email" value={form.admin_email} onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Input label="Password" type="password" value={form.admin_password} onChange={(e) => setForm((f) => ({ ...f, admin_password: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <Input label="Phone" value={form.admin_phone} onChange={(e) => setForm((f) => ({ ...f, admin_phone: e.target.value }))} />
                </div>
              </div>
            </div>
          )}

        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, hospital: null, loading: false })}
        title="Confirm Deletion"
        description={`You are about to permanently delete the hospital: ${deleteConfirm.hospital?.name}. All staff, doctors, and records tied to this hospital will be aggressively impacted. Type the hospital name to confirm.`}
        confirmText="Delete Hospital"
        expectedKeyword={deleteConfirm.hospital?.name || "DELETE"}
        onConfirm={handleDeleteConfirm}
        destructive={true}
        loading={deleteConfirm.loading}
      />
    </div>
  );
}
