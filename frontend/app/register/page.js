"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Activity, UploadCloud, CheckCircle2, Circle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(32, "Password must be less than 32 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Must contain at least one special character (!@#$%^&*)"
  );

const patientSchema = z.object({
  first_name: z.string().min(1, "This field is required"),
  last_name: z.string().min(1, "This field is required"),
  email: z.string().email("Enter a valid email address"),
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  dateOfBirth: z.string().min(1, "This field is required"),
  gender: z.string().min(1, "This field is required"),
  bloodGroup: z.string().min(1, "This field is required"),
  address: z.string().min(1, "This field is required"),
  knownAllergies: z.string().optional(),
  emergencyContactName: z.string().min(1, "This field is required"),
  emergencyContactPhone: z.string().regex(/^\d{10}$/, "Enter a valid phone number"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const doctorSchema = z.object({
  first_name: z.string().min(1, "This field is required"),
  last_name: z.string().min(1, "This field is required"),
  email: z.string().email("Enter a valid email address"),
  password: passwordSchema,
  confirmPassword: z.string(),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
  specialization: z.string().min(1, "This field is required"),
  qualification: z.string().min(1, "This field is required"),
  department: z.string().min(1, "This field is required"),
  hospitalId: z.string().min(1, "This field is required"),
  yearsOfExperience: z.coerce.number().min(0, "Please enter a valid number"),
  medicalRegNumber: z.string().min(1, "This field is required"),
  medicalCouncil: z.string().min(1, "This field is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const QUALIFICATIONS = ["MBBS", "MD", "MS", "BDS", "MDS", "Other"];

const getFileSizeString = (size) => {
  if (!size) return "";
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const validateFile = (file) => {
  if (!file) return "This field is required";
  const max = 10 * 1024 * 1024;
  if (file.size > max) return "File size must be under 10MB";
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowed.includes(file.type)) return "Only PDF and image files are allowed";
  return true;
};

const getPasswordStrength = (password) => {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
};

const PasswordStrengthIndicator = ({ password }) => {
  const score = getPasswordStrength(password);
  const strengthLabels = ["Very Weak", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
  const strengthColors = ["bg-gray-200", "bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const currentLabel = password ? strengthLabels[score] : "";

  const reqs = [
    { label: "At least 8 characters", valid: password?.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /[0-9]/.test(password) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) }
  ];

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex justify-between items-center text-xs font-semibold">
        <span className="text-gray-500 uppercase tracking-widest text-[10px]">Security level</span>
        <span className="text-gray-900">{currentLabel}</span>
      </div>
      <div className="flex gap-1.5 h-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "flex-1 rounded-full transition-all duration-300",
              level <= score ? strengthColors[score] : "bg-gray-200"
            )}
          />
        ))}
      </div>
      <ul className="text-xs space-y-2 mt-3 font-medium">
        {reqs.map((req, idx) => (
          <li key={idx} className={cn("flex items-center gap-2", req.valid ? "text-green-700" : "text-gray-500")}>
            {req.valid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-gray-300" />}
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [activeRole, setActiveRole] = useState("patient");
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [patientSubmitting, setPatientSubmitting] = useState(false);
  const [doctorSubmitting, setDoctorSubmitting] = useState(false);
  const [doctorSuccess, setDoctorSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const patientForm = useForm({
    mode: "onTouched",
    resolver: zodResolver(patientSchema),
    defaultValues: {
      first_name: "", last_name: "", email: "", password: "", confirmPassword: "", phone: "",
      dateOfBirth: "", gender: "", bloodGroup: "", address: "", knownAllergies: "",
      emergencyContactName: "", emergencyContactPhone: "", hospitalId: "",
    },
  });


  const doctorForm = useForm({
    mode: "onTouched",
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      first_name: "", last_name: "", email: "", password: "", confirmPassword: "", phone: "",
      specialization: "", qualification: "", department: "", hospitalId: "",
      yearsOfExperience: "", medicalRegNumber: "", medicalCouncil: "",
    },
  });

  useEffect(() => {
    document.title = "Register — MediTrack";
    const loadHospitals = async () => {
      setLoadingHospitals(true);
      try {
        const res = await api.get("/hospitals/");
        setHospitals(res?.data?.data || []);
      } catch (e) {
        toast.error("Unable to load hospitals");
      } finally {
        setLoadingHospitals(false);
      }
    };
    loadHospitals();
  }, []);

  const patientPassword = patientForm.watch("password");
  const doctorPassword = doctorForm.watch("password");

  const onSubmitPatient = async (values) => {
    setPatientSubmitting(true);
    try {
      await api.post("/auth/register/", {
        username: values.email.split("@")[0] || `user${Date.now()}`,
        password: values.password, email: values.email,
        first_name: values.first_name, last_name: values.last_name, phone: values.phone, role: "PATIENT",

        hospital_id: values.hospitalId || undefined,
        date_of_birth: values.dateOfBirth || null, gender: values.gender || null,
        blood_group: values.bloodGroup || null, address: values.address || null,
        known_allergies: values.knownAllergies || null,
        emergency_contact_name: values.emergencyContactName || null,
        emergency_contact_phone: values.emergencyContactPhone || null,
      });
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (error) {
      const msg = error?.response?.data?.message || "Registration failed";
      toast.error(msg);
    } finally {
      setPatientSubmitting(false);
    }
  };


  const onSubmitDoctor = async (values) => {
    setDoctorSubmitting(true);
    const fileCheck = validateFile(selectedFile);
    if (fileCheck !== true) {
      toast.error(fileCheck);
      setDoctorSubmitting(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("username", values.email.split("@")[0] || `user${Date.now()}`);
      formData.append("password", values.password);
      formData.append("email", values.email);
      formData.append("first_name", values.first_name);
      formData.append("last_name", values.last_name);
      formData.append("phone", values.phone);
      formData.append("role", "DOCTOR");

      if (values.hospitalId) formData.append("hospital_id", String(values.hospitalId));
      formData.append("specialization", values.specialization);
      formData.append("qualification", values.qualification);
      formData.append("department", values.department);
      formData.append("years_of_experience", values.yearsOfExperience);
      formData.append("medical_reg_number", values.medicalRegNumber);
      formData.append("medical_council", values.medicalCouncil);
      if (selectedFile) formData.append("certificate", selectedFile);

      await api.post("/auth/register/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDoctorSuccess(true);
      toast.success("Application submitted successfully");
    } catch (error) {
      const msg = error?.response?.data?.message || "Registration failed";
      toast.error(msg);
    } finally {
      setDoctorSubmitting(false);
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      if (validateFile(file) !== true) return toast.error(validateFile(file));
      setSelectedFile(file);
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file) !== true) return toast.error(validateFile(file));
      setSelectedFile(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 font-sans p-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 relative z-10 border border-gray-100">
        
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-sm mb-4">
            <Activity className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create an Account</h1>
          <p className="mt-1.5 text-sm text-gray-500 font-medium">Join MediTrack to manage your healthcare journey</p>
        </div>

        {/* Role Selector styled as Radio Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            type="button"
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
              activeRole === "patient" 
                ? "border-blue-600 bg-blue-50/50 text-blue-700" 
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            )}
            onClick={() => setActiveRole("patient")}
          >
            <span className="font-semibold text-sm">Patient</span>
          </button>
          <button
            type="button"
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
              activeRole === "doctor" 
                ? "border-blue-600 bg-blue-50/50 text-blue-700" 
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            )}
            onClick={() => setActiveRole("doctor")}
          >
            <span className="font-semibold text-sm">Doctor</span>
          </button>
        </div>

        <div>
          {activeRole === "patient" && (
            <form onSubmit={patientForm.handleSubmit(onSubmitPatient)} className="space-y-5 flex flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="First Name" placeholder="John" error={patientForm.formState.errors.first_name?.message} {...patientForm.register("first_name")} />
                <Input label="Last Name" placeholder="Doe" error={patientForm.formState.errors.last_name?.message} {...patientForm.register("last_name")} />
              </div>

              <Input label="Email address" type="email" placeholder="you@example.com" error={patientForm.formState.errors.email?.message} {...patientForm.register("email")} />
              
              <div>
                <Input label="Password" type="password" placeholder="••••••••" error={patientForm.formState.errors.password?.message} {...patientForm.register("password")} />
                <PasswordStrengthIndicator password={patientPassword} />
              </div>
              
              <Input label="Confirm password" type="password" placeholder="••••••••" error={patientForm.formState.errors.confirmPassword?.message} {...patientForm.register("confirmPassword")} />
              <Input label="Phone number" type="tel" placeholder="10-digit number" error={patientForm.formState.errors.phone?.message} {...patientForm.register("phone")} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Date of birth" type="date" error={patientForm.formState.errors.dateOfBirth?.message} {...patientForm.register("dateOfBirth")} />
                <div className="flex flex-col gap-1.5 w-full">
                  <label className="text-sm font-medium text-gray-700">Gender</label>
                  <select className={cn("flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500")} {...patientForm.register("gender")}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Blood Group</label>
                <select className={cn("flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500")} {...patientForm.register("bloodGroup")}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <textarea className={cn("flex min-h-[80px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500")} {...patientForm.register("address")} />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Known allergies (optional)</label>
                <textarea className={cn("flex min-h-[80px] w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500")} {...patientForm.register("knownAllergies")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Emergency contact name" error={patientForm.formState.errors.emergencyContactName?.message} {...patientForm.register("emergencyContactName")} />
                <Input label="Emergency phone" type="tel" error={patientForm.formState.errors.emergencyContactPhone?.message} {...patientForm.register("emergencyContactPhone")} />
              </div>

              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Hospital</label>
                <select className={cn("flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500")} {...patientForm.register("hospitalId")}>
                  <option value="">{loadingHospitals ? "Loading..." : "Select your hospital (optional)"}</option>
                  {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-0.5">Select the hospital you are registered with. If unsure, leave blank.</p>
              </div>

              <Button type="submit" className="w-full h-11 text-base mt-2" loading={patientSubmitting}>
                Create Account
              </Button>
            </form>
          )}

          {activeRole === "doctor" && (
            <div>
              {doctorSuccess ? (
                <div className="flex flex-col items-center py-10 text-center animate-fadeIn">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-gray-900">Application Submitted</h2>
                  <p className="mb-6 max-w-sm text-sm text-gray-500">
                    Your hospital admin will review your medical certificate and approve your account. You will be able to log in once approved.
                  </p>
                  <Button onClick={() => router.push("/login")} className="px-8">
                    Back to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={doctorForm.handleSubmit(onSubmitDoctor)} className="space-y-5 flex flex-col">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="First Name" placeholder="John" error={doctorForm.formState.errors.first_name?.message} {...doctorForm.register("first_name")} />
                    <Input label="Last Name" placeholder="Doe" error={doctorForm.formState.errors.last_name?.message} {...doctorForm.register("last_name")} />
                  </div>

                  <Input label="Email address" type="email" placeholder="you@hospital.com" error={doctorForm.formState.errors.email?.message} {...doctorForm.register("email")} />
                  
                  <div>
                    <Input label="Password" type="password" placeholder="••••••••" error={doctorForm.formState.errors.password?.message} {...doctorForm.register("password")} />
                    <PasswordStrengthIndicator password={doctorPassword} />
                  </div>
                  
                  <Input label="Confirm password" type="password" placeholder="••••••••" error={doctorForm.formState.errors.confirmPassword?.message} {...doctorForm.register("confirmPassword")} />
                  <Input label="Phone number" type="tel" placeholder="10-digit number" error={doctorForm.formState.errors.phone?.message} {...doctorForm.register("phone")} />
                  
                  <Input label="Specialization" placeholder="E.g. Cardiology" error={doctorForm.formState.errors.specialization?.message} {...doctorForm.register("specialization")} />
                  
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-sm font-medium text-gray-700">Qualification</label>
                    <select className={cn("flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500")} {...doctorForm.register("qualification")}>
                      <option value="">Select</option>
                      {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                    </select>
                  </div>
                  
                  <Input label="Department" error={doctorForm.formState.errors.department?.message} {...doctorForm.register("department")} />
                  
                  <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-sm font-medium text-gray-700">Hospital</label>
                    <select className={cn("flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500")} {...doctorForm.register("hospitalId")}>
                      <option value="">{loadingHospitals ? "Loading..." : "Select your hospital"}</option>
                      {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Years of experience" type="number" min="0" error={doctorForm.formState.errors.yearsOfExperience?.message} {...doctorForm.register("yearsOfExperience")} />
                    <Input label="Reg Number" placeholder="12345" error={doctorForm.formState.errors.medicalRegNumber?.message} {...doctorForm.register("medicalRegNumber")} />
                  </div>

                  <Input label="Medical Council name" error={doctorForm.formState.errors.medicalCouncil?.message} {...doctorForm.register("medicalCouncil")} />

                  <div className="pt-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Medical Certificate</label>
                    <div
                      onDragEnter={handleDragEnter} onDragOver={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200",
                        dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                      )}
                    >
                      <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileChange} />
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200">
                         <UploadCloud className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">Drag and drop your certificate here</p>
                      <p className="mt-1 text-xs text-gray-500">PDF or image • Max 10MB</p>
                      <Button variant="secondary" className="mt-4 pointer-events-none" size="sm">Browse file</Button>

                      {selectedFile && (
                        <div 
                          className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate text-sm font-medium text-gray-700 block text-left max-w-[200px]">
                            {selectedFile.name} <span className="text-gray-400 font-normal">({getFileSizeString(selectedFile.size)})</span>
                          </span>
                          <Button
                            variant="danger"
                            size="sm"
                            type="button"
                            onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11 text-base mt-4" loading={doctorSubmitting}>
                    Submit Application
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm font-medium text-gray-500">
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold text-blue-600 transition-colors hover:text-blue-700 underline-offset-4"
            onClick={() => router.push("/login")}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
