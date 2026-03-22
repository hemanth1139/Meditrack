"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

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
    admin_full_name: "",
    admin_email: "",
    admin_password: "",
    admin_phone: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/hospitals/");
      setItems(res.data.data || []);
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
    setForm({ name: "", address: "", city: "", state: "", phone: "", email: "", admin_full_name: "", admin_email: "", admin_password: "", admin_phone: "" });
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
      admin_full_name: "",
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
            full_name: form.admin_full_name,
            email: form.admin_email,
            password: form.admin_password,
            phone: form.admin_phone,
          },
        });
        toast.success("Hospital created and admin account set up. They can now log in at meditrack.com");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Save failed");
    }
  };

  const del = async (h) => {
    if (!confirm("Delete this hospital?")) return;
    try {
      await api.delete(`/hospitals/${h.id}/`);
      toast.success("Hospital deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[24px] font-semibold text-slate-900">Hospitals</div>
        <Button onClick={openAdd}>Add Hospital</Button>
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
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>{h.city}</TableCell>
                  <TableCell>{h.state}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => openEdit(h)}>
                        Edit
                      </Button>
                      <Button className="bg-red-600 hover:bg-red-700" onClick={() => del(h)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold">
              {editing ? "Edit Hospital" : "Add Hospital"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid gap-3">
              <div className="text-[14px] font-semibold text-slate-700">Hospital Details</div>
              {["name", "address", "city", "state", "phone", "email"].map((k) => (
                <div key={k} className="grid gap-1.5">
                  <label className="text-[13px] font-medium capitalize text-slate-600">{k.replace("_", " ")}</label>
                  <Input value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} />
                </div>
              ))}

              {!editing && (
                <>
                  <div className="mt-2 text-[14px] font-semibold text-slate-700">Hospital Admin Account</div>
                  <div className="text-[13px] text-slate-500">This person will manage this hospital and can log in immediately</div>
                  {[
                    { key: "admin_full_name", label: "Full name" },
                    { key: "admin_email", label: "Email" },
                    { key: "admin_password", label: "Password", type: "password" },
                    { key: "admin_phone", label: "Phone" },
                  ].map((field) => (
                    <div key={field.key} className="grid gap-1.5">
                      <label className="text-[13px] font-medium text-slate-600">{field.label}</label>
                      <Input
                        type={field.type || "text"}
                        value={form[field.key]}
                        onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

