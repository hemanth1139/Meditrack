"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCodeDisplay from "@/components/patient/QRCodeDisplay";
import api from "@/lib/api";
import { getUser } from "@/lib/auth";

export default function StaffRegisterPatientPage() {
  const router = useRouter();
  const user = getUser();
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdPatient, setCreatedPatient] = useState(null);
  
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      password: "MediTrackPatient2026!", // Default simple password 
      date_of_birth: "",
      gender: "M",
      blood_group: "O+",
      address: "",
      known_allergies: "None",
      emergency_contact_name: "",
      emergency_contact_phone: "",
    },
  });

  const submit = async (values) => {
    try {
      // Create a username from the email
      const username = values.email.split("@")[0] + Math.floor(Math.random() * 1000);
      
      const payload = {
        ...values,
        username,
        role: "PATIENT",
        hospital_id: user?.hospital_id || null
      };

      // 1. Register the user & patient profile
      const authRes = await api.post("/auth/register/", payload);
      
      // 2. Fetch the patient profile using the email to get the QR code and Patient ID
      const searchRes = await api.get(`/patients/?search=${values.email}`);
      const matchingPatient = searchRes.data.data?.data?.[0] || searchRes.data.data?.[0];

      if (matchingPatient) {
        setCreatedPatient(matchingPatient);
        setSuccessOpen(true);
      } else {
        toast.success("Patient registered successfully!");
        router.push("/dashboard/staff/patients");
      }
    } catch (e) {
      const status = e?.response?.status;
      if (!status) toast.error("Connection error. Is the backend running?");
      else {
        const errorData = e?.response?.data || {};
        const firstErrorKey = Object.keys(errorData)[0];
        const firstErrorDetails = errorData[firstErrorKey];
        toast.error(
          typeof firstErrorDetails === 'string' 
            ? firstErrorDetails 
            : Array.isArray(firstErrorDetails) ? firstErrorDetails[0] : "Failed to register patient. Email might be in use."
        );
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Register New Patient</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a full profile for a physically present walk-in patient. They will be immediately tied to your hospital.
        </p>
      </Card>

      <Card className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <form className="grid gap-6" onSubmit={handleSubmit(submit)}>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="First Name" {...register("first_name", { required: true })} placeholder="First name" />
              <Input label="Last Name" {...register("last_name")} placeholder="Last name" />
              <Input label="Email address" type="email" {...register("email", { required: true })} placeholder="patient@example.com" />
              <Input label="Phone number" {...register("phone", { required: true })} placeholder="+1..." />
              <Input label="Date of birth" type="date" {...register("date_of_birth", { required: true })} />
              
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700">Gender</label>
                <select className="flex h-10 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...register("gender", { required: true })}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Medical Profile</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Blood Group" {...register("blood_group", { required: true })} placeholder="e.g. O+" />
              <Input label="Known Allergies" {...register("known_allergies")} placeholder="E.g. Penicillin, Peanuts" />
              <div className="grid gap-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Home Address</label>
                <Textarea {...register("address", { required: true })} className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]" />
              </div>
              <Input label="Emergency Contact Name" {...register("emergency_contact_name", { required: true })} />
              <Input label="Emergency Contact Phone" {...register("emergency_contact_phone", { required: true })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" type="button" onClick={() => router.push("/dashboard/staff/patients")}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Creating Patient..." : "Register Patient"}</Button>
          </div>
        </form>
      </Card>

      <Dialog open={successOpen} onOpenChange={(open) => {
        if (!open) {
          setSuccessOpen(false);
          router.push("/dashboard/staff/patients");
        }
      }}>
        <DialogContent className="rounded-xl sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-center">Patient Successfully Enrolled!</DialogTitle>
          </DialogHeader>
          {createdPatient ? (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Generated Patient ID</div>
                <div className="text-2xl font-mono font-bold tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">
                  {createdPatient.patient_id}
                </div>
              </div>
              
              <div className="w-full bg-gray-50 p-6 rounded-2xl flex flex-col items-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Patient QR Code</p>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200">
                  <QRCodeDisplay value={createdPatient.patient_id} patient={createdPatient} />
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center max-w-[250px]">
                You can print this code or record the Patient ID. The patient can use their email to log in and manage their health.
              </p>

              <Button className="w-full" onClick={() => {
                setSuccessOpen(false);
                router.push("/dashboard/staff/patients");
              }}>
                Go to Patients List
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
