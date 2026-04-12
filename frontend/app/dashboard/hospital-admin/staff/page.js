"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function HospitalAdminStaffPage() {
  const user = getUser();
  const hospitalId = user?.hospital_id;

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [staffToDeactivate, setStaffToDeactivate] = useState(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    phone: "",
    department: "",
    role_title: "",
  });

  const load = useCallback(async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const res = await api.get("/users/", { params: { hospital_id: hospitalId, role: "STAFF" } });
      const responseData = res.data.data;
      setStaff(Array.isArray(responseData) ? responseData : responseData?.data || []);
    } catch {
      toast.error("Failed to load staff");
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    load();
  }, [load]);

  const createStaff = async () => {
    if (!hospitalId) {
      toast.error("Hospital context missing");
      return;
    }
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        department: form.department,
        role_title: form.role_title,
      };
      const res = await api.post("/users/staff/", payload);
      setCreatedCredentials(res.data?.data || { email: form.email, password: form.password });
      setSuccessOpen(true);
      setOpen(false);
      setForm({ first_name: "", last_name: "", email: "", password: "", phone: "", department: "", role_title: "" });
      load();
    } catch {
      toast.error("Failed to create staff");
    }
  };

  const copyCredentials = async () => {
    if (!createdCredentials) return;
    const text = `Email: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    await navigator.clipboard.writeText(text);
    toast.success("Credentials copied to clipboard");
  };

  const deactivate = async () => {
    if (!staffToDeactivate) return;
    try {
      const res = await api.post(`/users/${staffToDeactivate.id}/deactivate/`, { reason: deactivateReason, hospital_id: hospitalId });
      if (res.data.success === false) throw new Error(res.data.message);
      toast.success("Staff deactivated");
      setDeactivateOpen(false);
      setDeactivateReason("");
      load();
    } catch (e) {
      toast.error(e.message || "Failed to deactivate staff");
    }
  };

  const activate = async (s) => {
    try {
      await api.post(`/users/${s.id}/activate/`, { hospital_id: hospitalId });
      toast.success("Staff activated");
      load();
    } catch {
      toast.error("Failed to activate staff");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[24px] font-semibold text-slate-900">Hospital Staff</div>
        <Button onClick={() => setOpen(true)}>Create Staff Account</Button>
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
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{`${s.first_name || ""} ${s.last_name || ""}`.trim() || "—"}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.phone || "—"}</TableCell>
                  <TableCell>{s.department || "—"}</TableCell>
                  <TableCell>{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {s.is_active ? (
                      <Button className="bg-red-600 hover:bg-red-700" onClick={() => { setStaffToDeactivate(s); setDeactivateOpen(true); }}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button className="bg-green-600 hover:bg-green-700" onClick={() => activate(s)}>
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-medium">Create Staff Account</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {[
              { label: "First Name", key: "first_name" },
              { label: "Last Name", key: "last_name" },
              { label: "Email", key: "email" },
              { label: "Password", key: "password", type: "password" },
              { label: "Phone", key: "phone" },
              { label: "Department", key: "department" },
              { label: "Role title", key: "role_title" },
            ].map((f) => (
              <div key={f.key} className="grid gap-2">
                <label className="text-[13px] font-medium">{f.label}</label>
                <Input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createStaff}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-medium">Staff Account Created</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div>Email: {createdCredentials?.email}</div>
            <div>Password: {createdCredentials?.password}</div>
            <div className="text-[14px] text-slate-600">
              Share these credentials with the staff member. They can log in immediately at meditrack.com
            </div>
            <Button onClick={copyCredentials}>Copy Credentials</Button>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setSuccessOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-medium">Deactivate Staff</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2">
            <label className="text-[13px] font-medium">Reason for Deactivation</label>
            <Input value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} placeholder="Provide a reason..." />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeactivateOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={deactivate} disabled={!deactivateReason.trim()}>
              Deactivate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

