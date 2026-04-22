"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getUser } from "@/lib/auth";
import {
  Clock, CheckCircle2, UserPlus, UploadCloud, FileText,
  ExternalLink, Eye, X, Stethoscope, Award, Building2
} from "lucide-react";

const QUALIFICATIONS = ["MBBS", "MD", "MS", "BDS", "MDS", "DNB", "DM", "MCh", "Other"];
const SPECIALIZATIONS = [
  "General Medicine", "Surgery", "Pediatrics", "Obstetrics & Gynaecology",
  "Orthopedics", "Cardiology", "Neurology", "Dermatology", "Psychiatry",
  "Ophthalmology", "ENT", "Radiology", "Anesthesiology", "Pathology", "Other"
];

const validateFile = (file) => {
  if (!file) return "Medical certificate is required";
  if (file.size > 10 * 1024 * 1024) return "File must be under 10MB";
  const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (!allowed.includes(file.type)) return "Only PDF and image files are allowed";
  return true;
};

function FileSizeStr(size) {
  const kb = size / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

function CertificateUpload({ file, setFile, error }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    const check = validateFile(f);
    if (check !== true) { toast.error(check); return; }
    setFile(f);
  };

  return (
    <div>
      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
        Medical Certificate <span className="text-red-500">*</span>
      </label>
      <div
        onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer?.files?.[0]); }}
        onClick={() => !file && ref.current?.click()}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
          drag ? "border-blue-500 bg-blue-50" :
          error ? "border-red-300 bg-red-50" :
          file ? "border-green-400 bg-green-50" :
          "border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer"
        }`}
      >
        <input ref={ref} type="file" className="hidden" accept="application/pdf,image/*" onChange={(e) => handleFile(e.target.files?.[0])} />
        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-slate-800 truncate max-w-[200px]">{file.name}</div>
                <div className="text-xs text-slate-400">{FileSizeStr(file.size)}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); if (ref.current) ref.current.value = ""; }}
              className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200">
              <UploadCloud className="w-5 h-5 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-700">Drag & drop or click to upload</p>
            <p className="mt-1 text-xs text-slate-400">PDF or image (JPG/PNG) · Max 10MB</p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function DoctorDetailDialog({ doc, open, onClose }) {
  if (!doc) return null;
  const name = [doc.first_name, doc.last_name].filter(Boolean).join(" ") || doc.email || "—";
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl p-6 border-slate-200 shadow-xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900">Doctor Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-xs text-slate-400 block font-semibold uppercase tracking-widest">Name</span><span className="font-semibold text-slate-800">{name}</span></div>
            <div><span className="text-xs text-slate-400 block font-semibold uppercase tracking-widest">Email</span><span className="text-slate-600">{doc.email}</span></div>
            <div><span className="text-xs text-slate-400 block font-semibold uppercase tracking-widest">Specialization</span><span className="text-slate-700">{doc.specialization || "—"}</span></div>
            <div><span className="text-xs text-slate-400 block font-semibold uppercase tracking-widest">Qualification</span><span className="text-slate-700">{doc.qualification || "—"}</span></div>
            <div><span className="text-xs text-slate-400 block font-semibold uppercase tracking-widest">Department</span><span className="text-slate-700">{doc.department || "—"}</span></div>
            <div><span className="text-xs text-slate-400 block font-semibold uppercase tracking-widest">Medical Council</span><span className="text-slate-700">{doc.medical_council || "—"}</span></div>
            <div><span className="text-xs text-slate-400 block font-semibold uppercase tracking-widest">Reg Number</span><span className="font-mono text-slate-700">{doc.medical_reg_number || "—"}</span></div>
            <div><span className="text-xs text-slate-400 block font-semibold uppercase tracking-widest">Experience</span><span className="text-slate-700">{doc.years_of_experience != null ? `${doc.years_of_experience} yrs` : "—"}</span></div>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Certificate</div>
            {doc.certificate_url ? (
              <a href={doc.certificate_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors border border-blue-100">
                <FileText className="w-4 h-4" /> View Certificate <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            ) : (
              <div className="text-sm text-slate-400">No certificate on file</div>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function HospitalAdminDoctorsPage() {
  const user = getUser();
  const hospitalId = user?.hospital_id;

  const [activeTab, setActiveTab] = useState("pending");
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTyped, setRejectTyped] = useState("");
  const [selected, setSelected] = useState(null);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateTyped, setDeactivateTyped] = useState("");
  const [docToDeactivate, setDocToDeactivate] = useState(null);

  // Add Doctor modal
  const [addOpen, setAddOpen] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [certFile, setCertFile] = useState(null);
  const [certError, setCertError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [addForm, setAddForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    specialization: "", qualification: "", department: "",
    medical_reg_number: "", medical_council: "", years_of_experience: "",
    password: "",
  });
  const [addErrors, setAddErrors] = useState({});

  // Detail view modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailDoc, setDetailDoc] = useState(null);

  const load = useCallback(async () => {
    if (!hospitalId) return;
    setLoading(true);
    try {
      const [rp, ra] = await Promise.all([
        api.get("/users/doctors/pending/", { params: { hospital_id: hospitalId } }),
        api.get("/users/doctors/approved/", { params: { hospital_id: hospitalId } })
      ]);
      const pendingData = rp.data.data;
      const approvedData = ra.data.data;
      setPending(Array.isArray(pendingData) ? pendingData : pendingData?.data || []);
      setApproved(Array.isArray(approvedData) ? approvedData : approvedData?.data || []);
    } catch {
      toast.error("Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (rejectOpen) setRejectTyped(""); if (deactivateOpen) setDeactivateTyped(""); }, [rejectOpen, deactivateOpen]);

  const approve = async (doc) => {
    try {
      await api.post(`/users/doctors/${doc.id}/approve/`, { hospital_id: hospitalId });
      toast.success("Doctor approved");
      load();
    } catch {
      toast.error("Approve failed");
    }
  };

  const reject = async () => {
    if (!selected) return;
    try {
      await api.post(`/users/doctors/${selected.id}/reject/`, { reason: rejectReason, hospital_id: hospitalId });
      toast.success("Doctor rejected");
      setRejectOpen(false); setRejectReason(""); load();
    } catch {
      toast.error("Reject failed");
    }
  };

  const deactivate = async () => {
    if (!docToDeactivate) return;
    try {
      const res = await api.post(`/users/${docToDeactivate.id}/deactivate/`, { reason: deactivateReason, hospital_id: hospitalId });
      if (res.data.success === false) throw new Error(res.data.message);
      toast.success("Doctor deactivated");
      setDeactivateOpen(false); setDeactivateReason(""); load();
    } catch (e) {
      toast.error(e.message || "Failed to deactivate");
    }
  };

  const activateDoc = async (doc) => {
    try {
      await api.post(`/users/${doc.id}/activate/`, { hospital_id: hospitalId });
      toast.success("Doctor activated"); load();
    } catch {
      toast.error("Failed to activate doctor");
    }
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({ ...prev, [name]: value }));
    if (addErrors[name]) setAddErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateAddForm = () => {
    const required = ["first_name", "email", "specialization", "qualification", "department", "medical_reg_number", "medical_council"];
    const errs = {};
    required.forEach((f) => { if (!addForm[f]?.trim()) errs[f] = "Required"; });
    if (addForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) errs.email = "Enter a valid email";
    const fileCheck = validateFile(certFile);
    if (fileCheck !== true) { setCertError(fileCheck); errs._cert = fileCheck; } else setCertError("");
    setAddErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submitAddDoctor = async (e) => {
    e.preventDefault();
    if (!validateAddForm()) return;
    setAddSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(addForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      fd.append("certificate", certFile);
      const res = await api.post("/users/doctors/create-doctor/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const tp = res.data?.data?.temp_password;
      toast.success("Doctor added successfully!");
      setTempPassword(tp || "");
      setAddOpen(false);
      setAddForm({ first_name: "", last_name: "", email: "", phone: "", specialization: "", qualification: "", department: "", medical_reg_number: "", medical_council: "", years_of_experience: "", password: "" });
      setCertFile(null);
      setActiveTab("approved");
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to add doctor";
      toast.error(msg);
    } finally {
      setAddSubmitting(false);
    }
  };

  const resetAddModal = () => {
    setAddOpen(false);
    setCertFile(null);
    setCertError("");
    setAddErrors({});
    setAddForm({ first_name: "", last_name: "", email: "", phone: "", specialization: "", qualification: "", department: "", medical_reg_number: "", medical_council: "", years_of_experience: "", password: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-[24px] font-semibold text-slate-900">Doctors Management</div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm flex items-center gap-2"
          onClick={() => setAddOpen(true)}
        >
          <UserPlus className="w-4 h-4" />
          Add Doctor
        </Button>
      </div>

      {/* Temp Password Banner */}
      {tempPassword && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="shrink-0 mt-0.5 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-amber-800 text-sm">Doctor added — share this temporary password</div>
            <div className="mt-1 font-mono text-amber-900 text-base tracking-widest bg-amber-100 inline-block px-3 py-1 rounded-lg border border-amber-200">{tempPassword}</div>
            <div className="text-xs text-amber-600 mt-1">The doctor will be required to change this password on first login.</div>
          </div>
          <button onClick={() => setTempPassword("")} className="text-amber-400 hover:text-amber-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
              activeTab === "pending"
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2"><Clock size={16} /> Pending</div>
            {pending.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "pending" ? "bg-white text-blue-600" : "bg-blue-100 text-blue-700"}`}>
                {pending.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl transition-all border ${
              activeTab === "approved"
                ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/20"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            <div className="flex items-center gap-2"><CheckCircle2 size={16} /> Approved</div>
            {approved.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === "approved" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {approved.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "pending" && (
            <div className="animate-fadeIn">
              {loading ? (
                <div className="grid gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
              ) : (
                <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Doctor</TableHead>
                        <TableHead className="font-bold">Specialization</TableHead>
                        <TableHead className="font-bold">Reg #</TableHead>
                        <TableHead className="font-bold">Certificate</TableHead>
                        <TableHead className="font-bold">Submitted</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-slate-500 font-medium">No pending applications.</TableCell>
                        </TableRow>
                      ) : (
                        pending.map((d) => (
                          <TableRow key={d.id} className="hover:bg-slate-50">
                            <TableCell className="font-semibold text-slate-900">{[d.first_name, d.last_name].filter(Boolean).join(" ") || d.email || "—"}</TableCell>
                            <TableCell>{d.specialization || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{d.medical_reg_number || "—"}</TableCell>
                            <TableCell>
                              {d.certificate_url ? (
                                <a href={d.certificate_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                                  <FileText className="w-3.5 h-3.5" /> View <ExternalLink className="w-3 h-3 opacity-60" />
                                </a>
                              ) : (
                                <span className="text-xs text-amber-500 font-medium">Not uploaded</span>
                              )}
                            </TableCell>
                            <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => { setDetailDoc(d); setDetailOpen(true); }}>
                                  <Eye className="w-3.5 h-3.5 mr-1" /> Details
                                </Button>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0" onClick={() => approve(d)}>Approve</Button>
                                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => { setSelected(d); setRejectOpen(true); }}>Reject</Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {activeTab === "approved" && (
            <div className="animate-fadeIn">
              {loading ? (
                <div className="grid gap-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
              ) : (
                <Card className="rounded-2xl border-slate-200 bg-white p-0 shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-bold">Doctor</TableHead>
                        <TableHead className="font-bold">Specialization</TableHead>
                        <TableHead className="font-bold">Certificate</TableHead>
                        <TableHead className="font-bold">Joined</TableHead>
                        <TableHead className="text-right font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approved.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-slate-500 font-medium">No approved doctors.</TableCell>
                        </TableRow>
                      ) : (
                        approved.map((d) => (
                          <TableRow key={d.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setDetailDoc(d); setDetailOpen(true); }}>
                            <TableCell className="font-semibold text-slate-900">{[d.first_name, d.last_name].filter(Boolean).join(" ") || d.email || "—"}</TableCell>
                            <TableCell>{d.specialization || "—"}</TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              {d.certificate_url ? (
                                <a href={d.certificate_url} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                                  <FileText className="w-3.5 h-3.5" /> View <ExternalLink className="w-3 h-3 opacity-60" />
                                </a>
                              ) : (
                                <span className="text-xs text-slate-400">None</span>
                              )}
                            </TableCell>
                            <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                              {d.is_active ? (
                                <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => { setDocToDeactivate(d); setDeactivateOpen(true); }}>Deactivate</Button>
                              ) : (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white border-0" onClick={() => activateDoc(d)}>Activate</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Doctor Dialog ── */}
      <Dialog open={addOpen} onOpenChange={resetAddModal}>
        <DialogContent className="rounded-2xl p-6 border-slate-200 shadow-xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" /> Add New Doctor
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">The doctor will be directly approved and can login immediately.</p>
          </DialogHeader>

          <form onSubmit={submitAddDoctor} className="space-y-4 mt-4">
            {/* Personal */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">First Name <span className="text-red-500">*</span></label>
                <Input name="first_name" value={addForm.first_name} onChange={handleAddFormChange} placeholder="John" className={addErrors.first_name ? "border-red-400" : ""} />
                {addErrors.first_name && <p className="text-xs text-red-500 mt-1">{addErrors.first_name}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Last Name</label>
                <Input name="last_name" value={addForm.last_name} onChange={handleAddFormChange} placeholder="Doe" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Email <span className="text-red-500">*</span></label>
                <Input name="email" type="email" value={addForm.email} onChange={handleAddFormChange} placeholder="doctor@hospital.com" className={addErrors.email ? "border-red-400" : ""} />
                {addErrors.email && <p className="text-xs text-red-500 mt-1">{addErrors.email}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Phone</label>
                <Input name="phone" type="tel" value={addForm.phone} onChange={handleAddFormChange} placeholder="10-digit number" />
              </div>
            </div>

            {/* Professional */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Specialization <span className="text-red-500">*</span></label>
                <select name="specialization" value={addForm.specialization} onChange={handleAddFormChange}
                  className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${addErrors.specialization ? "border-red-400" : "border-slate-300"}`}>
                  <option value="">Select</option>
                  {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {addErrors.specialization && <p className="text-xs text-red-500 mt-1">{addErrors.specialization}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Qualification <span className="text-red-500">*</span></label>
                <select name="qualification" value={addForm.qualification} onChange={handleAddFormChange}
                  className={`flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${addErrors.qualification ? "border-red-400" : "border-slate-300"}`}>
                  <option value="">Select</option>
                  {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
                {addErrors.qualification && <p className="text-xs text-red-500 mt-1">{addErrors.qualification}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Department <span className="text-red-500">*</span></label>
                <Input name="department" value={addForm.department} onChange={handleAddFormChange} placeholder="E.g. Cardiology" className={addErrors.department ? "border-red-400" : ""} />
                {addErrors.department && <p className="text-xs text-red-500 mt-1">{addErrors.department}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Years of Experience</label>
                <Input name="years_of_experience" type="number" min="0" value={addForm.years_of_experience} onChange={handleAddFormChange} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Reg Number <span className="text-red-500">*</span></label>
                <Input name="medical_reg_number" value={addForm.medical_reg_number} onChange={handleAddFormChange} placeholder="MH12345" className={addErrors.medical_reg_number ? "border-red-400" : ""} />
                {addErrors.medical_reg_number && <p className="text-xs text-red-500 mt-1">{addErrors.medical_reg_number}</p>}
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1 block">Medical Council <span className="text-red-500">*</span></label>
                <Input name="medical_council" value={addForm.medical_council} onChange={handleAddFormChange} placeholder="Maharashtra Medical Council" className={addErrors.medical_council ? "border-red-400" : ""} />
                {addErrors.medical_council && <p className="text-xs text-red-500 mt-1">{addErrors.medical_council}</p>}
              </div>
            </div>

            {/* Temporary Password */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1 block">
                Temporary Password <span className="text-slate-400 font-normal">(auto-generated if left blank)</span>
              </label>
              <Input name="password" type="text" value={addForm.password} onChange={handleAddFormChange} placeholder="Leave blank to auto-generate" />
              <p className="text-xs text-slate-400 mt-1">Doctor must change this password on first login.</p>
            </div>

            {/* Certificate Upload */}
            <CertificateUpload file={certFile} setFile={setCertFile} error={certError} />

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
              <Button type="button" variant="outline" className="border-slate-200" onClick={resetAddModal}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white border-0" disabled={addSubmitting}>
                {addSubmitting ? "Adding..." : "Add Doctor"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Doctor Detail Dialog ── */}
      <DoctorDetailDialog doc={detailDoc} open={detailOpen} onClose={() => setDetailOpen(false)} />

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-2xl p-6 border-slate-200 shadow-xl">
          <DialogHeader><DialogTitle className="text-lg font-bold text-slate-900">Reject Application</DialogTitle></DialogHeader>
          <div className="grid gap-2 mt-2">
            <label className="text-sm font-semibold text-slate-700">Reason for Rejection</label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="resize-none min-h-[100px]" placeholder="Explain why the application is not being approved..." />
          </div>
          <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-gray-100">
            <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg border border-red-100 mb-2">This is a sensitive action. Please confirm.</div>
            <label className="text-sm font-semibold text-gray-700">Type <span className="font-extrabold font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-900">REJECT</span> to confirm</label>
            <Input value={rejectTyped} onChange={(e) => setRejectTyped(e.target.value)} placeholder="REJECT" className="font-mono text-sm" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={reject} disabled={!rejectReason.trim() || rejectTyped !== "REJECT"}>Confirm Rejection</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Deactivate Dialog ── */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="rounded-2xl p-6 border-slate-200 shadow-xl">
          <DialogHeader><DialogTitle className="text-lg font-bold text-slate-900">Deactivate Doctor</DialogTitle></DialogHeader>
          <div className="grid gap-2 mt-2">
            <label className="text-sm font-semibold text-slate-700">Reason for Deactivation</label>
            <Textarea value={deactivateReason} onChange={(e) => setDeactivateReason(e.target.value)} placeholder="Will restrict their access..." className="resize-none min-h-[100px]" />
          </div>
          <div className="flex flex-col gap-1.5 mt-2 pt-4 border-t border-gray-100">
            <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg border border-red-100 mb-2">This is a sensitive action. Please confirm.</div>
            <label className="text-sm font-semibold text-gray-700">Type <span className="font-extrabold font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-900">DEACTIVATE</span> to confirm</label>
            <Input value={deactivateTyped} onChange={(e) => setDeactivateTyped(e.target.value)} placeholder="DEACTIVATE" className="font-mono text-sm" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white border-0" onClick={deactivate} disabled={!deactivateReason.trim() || deactivateTyped !== "DEACTIVATE"}>Deactivate Account</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
