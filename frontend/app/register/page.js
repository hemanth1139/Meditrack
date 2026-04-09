"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import api from "@/lib/api";

const TAB_ITEMS = [
  { key: "patient", label: "Patient" },
  { key: "doctor", label: "Doctor" },
];

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
  fullName: z.string().min(1, "This field is required"),
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
  emergencyContactPhone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const doctorSchema = z.object({
  fullName: z.string().min(1, "This field is required"),
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

// Animation Variants


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
  const strengthColors = ["slate", "red", "orange", "yellow", "blue", "green"];
  
  const currentLabel = password ? strengthLabels[score] : "";
  const currentColor = strengthColors[score];

  const reqs = [
    { label: "At least 8 characters", valid: password?.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Lowercase letter", valid: /[a-z]/.test(password) },
    { label: "Number", valid: /[0-9]/.test(password) },
    { label: "Special character", valid: /[^A-Za-z0-9]/.test(password) }
  ];

  if (!password) return null;

  return (
    <div   className="mt-2 space-y-2">
      <div className="flex justify-between items-center text-[12px] font-medium">
        <span className="text-slate-500">Password strength:</span>
        <span className={`text-${currentColor}-600`}>{currentLabel}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              level <= score ? `bg-${currentColor}-500` : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <ul className="text-[11px] space-y-1 mt-2 text-slate-500">
        {reqs.map((req, idx) => (
          <li key={idx} className={`flex items-center gap-1.5 ${req.valid ? "text-green-600" : "text-slate-500"}`}>
            <span className="flex-shrink-0 w-3 h-3 flex items-center justify-center">
              {req.valid ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-full h-full"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
              )}
            </span>
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

const InputField = ({ label, error, children }) => (
  <div  className="flex flex-col gap-1.5">
    <label className="text-[13px] font-semibold tracking-wide text-slate-700 uppercase">{label}</label>
    <div className="group relative">
      {children}
      <div className="absolute inset-0 -z-10 rounded-md bg-gradient-to-br from-blue-500/0 to-indigo-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur" />
    </div>
    {error && (
      <motion.span   className="text-[12px] font-medium text-red-500">
        {error}
      </motion.span>
    )}
  </div>
);

const inputClass = "h-11 w-full rounded-lg border border-slate-200/80 bg-white/50 px-4 text-[14px] shadow-sm transition-all duration-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10 outline-none placeholder:text-slate-400";
const textareaClass = "w-full rounded-lg border border-slate-200/80 bg-white/50 p-3 text-[14px] shadow-sm transition-all duration-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10 outline-none placeholder:text-slate-400 resize-y min-h-[80px]";

export default function RegisterPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("patient");
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
      fullName: "", email: "", password: "", confirmPassword: "", phone: "",
      dateOfBirth: "", gender: "", bloodGroup: "", address: "", knownAllergies: "",
      emergencyContactName: "", emergencyContactPhone: "",
    },
  });

  const doctorForm = useForm({
    mode: "onTouched",
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      fullName: "", email: "", password: "", confirmPassword: "", phone: "",
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
      const nameParts = values.fullName.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      let last_name = nameParts.slice(1).join(" ");
      if (!last_name) last_name = first_name;
      await api.post("/auth/register/", {
        username: values.email.split("@")[0] || `user${Date.now()}`,
        password: values.password, email: values.email,
        first_name, last_name, phone: values.phone, role: "PATIENT",
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
      const nameParts = values.fullName.trim().split(/\s+/);
      const first_name = nameParts[0] || "";
      let last_name = nameParts.slice(1).join(" ");
      if (!last_name) last_name = first_name;
      const formData = new FormData();
      formData.append("username", values.email.split("@")[0] || `user${Date.now()}`);
      formData.append("password", values.password);
      formData.append("email", values.email);
      formData.append("first_name", first_name || "");
      formData.append("last_name", last_name || "");
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 font-sans px-4 py-8">
      {/* Static Background Elements (Optimized for performance) */}
      <div className="pointer-events-none fixed -top-[20%] -right-[10%] h-[800px] w-[800px] rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-400/20 blur-[100px]" />
      <div className="pointer-events-none fixed -bottom-[20%] -left-[10%] h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-cyan-300/30 to-blue-500/10 blur-[100px]" />
      <div className="pointer-events-none fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

      <div 
        
        
        
        className="relative z-10 w-full max-w-[640px] rounded-[24px] border border-white/40 bg-white/70 backdrop-blur-xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 transition-all duration-300 hover:shadow-[0_8px_40px_rgb(37,99,235,0.08)]"
      >
        <div  className="mb-8 text-center">
          <div 
            
            
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/30 mb-4"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-white drop-shadow-md">
              <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-slate-900 drop-shadow-sm">Create an Account</h1>
          <p className="mt-2 text-[15px] font-medium text-slate-500">Join MediTrack to manage your healthcare journey</p>
        </div>

        <div  className="mb-8 flex overflow-x-auto border-b-2 border-slate-200/80">
          
            {TAB_ITEMS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex-1 whitespace-nowrap px-4 py-3 text-[14px] outline-none transition-colors ${active ? "font-semibold text-blue-600" : "font-medium text-slate-500 hover:text-slate-700"}`}
                >
                  {tab.label}
                  {active && (
                    <div
                      
                      className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-blue-600"
                      
                    />
                  )}
                </button>
              );
            })}
          
        </div>

        <div>
          {activeTab === "patient" && (
            <form onSubmit={patientForm.handleSubmit(onSubmitPatient)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Full name" error={patientForm.formState.errors.fullName?.message}>
                  <input className={inputClass} {...patientForm.register("fullName")} />
                </InputField>
                <InputField label="Email address" error={patientForm.formState.errors.email?.message}>
                  <input type="email" className={inputClass} {...patientForm.register("email")} />
                </InputField>
                <div className="flex flex-col">
                  <InputField label="Password" error={patientForm.formState.errors.password?.message}>
                    <input type="password" className={inputClass} {...patientForm.register("password")} />
                  </InputField>
                  <PasswordStrengthIndicator password={patientPassword} />
                </div>
                <InputField label="Confirm password" error={patientForm.formState.errors.confirmPassword?.message}>
                  <input type="password" className={inputClass} {...patientForm.register("confirmPassword")} />
                </InputField>
                <InputField label="Phone number" error={patientForm.formState.errors.phone?.message}>
                  <input type="tel" className={inputClass} {...patientForm.register("phone")} />
                </InputField>
                <InputField label="Date of birth" error={patientForm.formState.errors.dateOfBirth?.message}>
                  <input type="date" className={inputClass} {...patientForm.register("dateOfBirth")} />
                </InputField>
                <InputField label="Gender" error={patientForm.formState.errors.gender?.message}>
                  <select className={inputClass} {...patientForm.register("gender")}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </InputField>
                <InputField label="Blood group" error={patientForm.formState.errors.bloodGroup?.message}>
                  <select className={inputClass} {...patientForm.register("bloodGroup")}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </InputField>
              </div>

              <InputField label="Address" error={patientForm.formState.errors.address?.message}>
                <textarea className={textareaClass} {...patientForm.register("address")} />
              </InputField>
              <InputField label="Known allergies (optional)" error={patientForm.formState.errors.knownAllergies?.message}>
                <textarea className={textareaClass} {...patientForm.register("knownAllergies")} />
              </InputField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Emergency contact name" error={patientForm.formState.errors.emergencyContactName?.message}>
                  <input className={inputClass} {...patientForm.register("emergencyContactName")} />
                </InputField>
                <InputField label="Emergency phone" error={patientForm.formState.errors.emergencyContactPhone?.message}>
                  <input type="tel" className={inputClass} {...patientForm.register("emergencyContactPhone")} />
                </InputField>
              </div>

              <div  className="pt-4">
                <button
                  
                  type="submit"
                  disabled={patientSubmitting}
                  className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:to-indigo-500 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-100" />
                  {patientSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {activeTab === "doctor" && (
            <div>
              
                {doctorSuccess ? (
                  <div 
                     
                     
                    
                    className="flex flex-col items-center py-10 text-center"
                  >
                    <div 
                       
                      animate={{ scale: 1, transition: { type: "spring", stiffness: 200, damping: 20, delay: 0.1 } }}
                      className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600"
                    >
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M9.00029 16.2L5.70029 13L4.60029 14.1L9.00029 18.5L20.0003 7.50003L18.9003 6.40003L9.00029 16.2Z" fill="currentColor" />
                      </svg>
                    </div>
                    <h2 className="mb-2 text-[20px] font-semibold text-slate-900">Application Submitted</h2>
                    <p className="mb-6 max-w-[380px] text-[14px] text-slate-500">
                      Your hospital admin will review your medical certificate and approve your account. You will be able to log in once approved.
                    </p>
                    <button
                      
                      
                      onClick={() => router.push("/login")}
                      className="rounded-xl bg-blue-600 px-6 py-2.5 text-[14px] font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700"
                    >
                      Back to Login
                    </button>
                  </div>
                ) : (
                  <form 
                       
                    onSubmit={doctorForm.handleSubmit(onSubmitDoctor)} className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField label="Full name" error={doctorForm.formState.errors.fullName?.message}>
                        <input className={inputClass} {...doctorForm.register("fullName")} />
                      </InputField>
                      <InputField label="Email address" error={doctorForm.formState.errors.email?.message}>
                        <input type="email" className={inputClass} {...doctorForm.register("email")} />
                      </InputField>
                      <div className="flex flex-col">
                        <InputField label="Password" error={doctorForm.formState.errors.password?.message}>
                          <input type="password" className={inputClass} {...doctorForm.register("password")} />
                        </InputField>
                        <PasswordStrengthIndicator password={doctorPassword} />
                      </div>
                      <InputField label="Confirm password" error={doctorForm.formState.errors.confirmPassword?.message}>
                        <input type="password" className={inputClass} {...doctorForm.register("confirmPassword")} />
                      </InputField>
                      <InputField label="Phone number" error={doctorForm.formState.errors.phone?.message}>
                        <input type="tel" className={inputClass} {...doctorForm.register("phone")} />
                      </InputField>
                      <InputField label="Specialization" error={doctorForm.formState.errors.specialization?.message}>
                        <input className={inputClass} {...doctorForm.register("specialization")} />
                      </InputField>
                      <InputField label="Qualification" error={doctorForm.formState.errors.qualification?.message}>
                        <select className={inputClass} {...doctorForm.register("qualification")}>
                          <option value="">Select</option>
                          {QUALIFICATIONS.map((q) => <option key={q} value={q}>{q}</option>)}
                        </select>
                      </InputField>
                      <InputField label="Department" error={doctorForm.formState.errors.department?.message}>
                        <input className={inputClass} {...doctorForm.register("department")} />
                      </InputField>
                    </div>

                    <InputField label="Hospital" error={doctorForm.formState.errors.hospitalId?.message}>
                      <select className={inputClass} {...doctorForm.register("hospitalId")}>
                        <option value="">{loadingHospitals ? "Loading..." : "Select your hospital"}</option>
                        {hospitals.map((hospital) => <option key={hospital.id} value={hospital.id}>{hospital.name}</option>)}
                      </select>
                    </InputField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField label="Years of experience" error={doctorForm.formState.errors.yearsOfExperience?.message}>
                        <input type="number" min="0" className={inputClass} {...doctorForm.register("yearsOfExperience")} />
                      </InputField>
                      <InputField label="Medical Registration Number" error={doctorForm.formState.errors.medicalRegNumber?.message}>
                        <input className={inputClass} {...doctorForm.register("medicalRegNumber")} />
                      </InputField>
                    </div>

                    <InputField label="Medical Council name" error={doctorForm.formState.errors.medicalCouncil?.message}>
                      <input className={inputClass} {...doctorForm.register("medicalCouncil")} />
                    </InputField>

                    <div  className="pt-2">
                      <label className="mb-1.5 block text-[13px] font-semibold tracking-wide text-slate-700 uppercase">Medical Certificate</label>
                      <div
                        
                        onDragEnter={handleDragEnter} onDragOver={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-300 bg-slate-50/50 hover:bg-slate-100/50"}`}
                      >
                        <input ref={fileInputRef} type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileChange} />
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-slate-500">
                            <path d="M4 4H14L18 8V20C18 21.1 17.1 22 16 22H4C2.9 22 2 21.1 2 20V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M12 10V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M9 13L12 10L15 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <p className="text-[14px] font-medium text-slate-700">Drag and drop your certificate here</p>
                        <p className="mt-1 text-[12px] text-slate-500">PDF or image • Max 10MB</p>
                        <p className="mt-2 text-[14px] font-semibold text-blue-600">Browse file</p>

                        {selectedFile && (
                          <div 
                             
                            className="absolute inset-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate text-[13px] font-medium text-slate-700">{selectedFile.name} ({getFileSizeString(selectedFile.size)})</span>
                            <button
                              type="button"
                              onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                              className="ml-4 rounded-md bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-100"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div  className="pt-4">
                      <button
                        
                        type="submit"
                        disabled={doctorSubmitting}
                        className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:to-indigo-500 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-100" />
                        {doctorSubmitting ? "Submitting..." : "Submit Application"}
                      </button>
                    </div>
                  </form>
                )}
              
            </div>
          )}
        </div>

        <div  className="mt-8 text-center text-[14px] font-medium text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline underline-offset-4"
            onClick={() => router.push("/login")}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
