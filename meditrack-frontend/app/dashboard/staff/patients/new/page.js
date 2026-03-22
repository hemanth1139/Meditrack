"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCodeDisplay from "@/components/patient/QRCodeDisplay";
import api from "@/lib/api";

export default function StaffRegisterPatientPage() {
  const [successOpen, setSuccessOpen] = useState(false);
  const [created, setCreated] = useState(null);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      user_id: "",
      hospital_id: "",
      date_of_birth: "",
      gender: "M",
      blood_group: "O+",
      address: "",
      known_allergies: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      aadhaar_number: "",
    },
  });

  const submit = async (values) => {
    try {
      const res = await api.post("/patients/", {
        ...values,
        hospital_id: Number(values.hospital_id),
        user_id: Number(values.user_id),
      });
      setCreated(res.data.data);
      setSuccessOpen(true);
      toast.success("Patient registered");
    } catch (e) {
      const status = e?.response?.status;
      if (!status) toast.error("Connection error. Is the backend running?");
      else toast.error(e?.response?.data?.message || "Failed to register patient");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <div className="text-[18px] font-semibold text-slate-900">Register Patient</div>
        <div className="mt-2 text-[14px] text-slate-600">
          Staff creates the patient profile. The user account must already exist.
        </div>
      </Card>

      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <form className="grid gap-4" onSubmit={handleSubmit(submit)}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-[13px] font-medium">User ID</label>
              <Input {...register("user_id", { required: true })} placeholder="Existing PATIENT user id" />
            </div>
            <div className="grid gap-2">
              <label className="text-[13px] font-medium">Hospital ID</label>
              <Input {...register("hospital_id", { required: true })} placeholder="Hospital id" />
            </div>
            <div className="grid gap-2">
              <label className="text-[13px] font-medium">Date of birth</label>
              <Input type="date" {...register("date_of_birth", { required: true })} />
            </div>
            <div className="grid gap-2">
              <label className="text-[13px] font-medium">Gender</label>
              <Input {...register("gender", { required: true })} />
            </div>
            <div className="grid gap-2">
              <label className="text-[13px] font-medium">Blood group</label>
              <Input {...register("blood_group", { required: true })} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-[13px] font-medium">Address</label>
              <Textarea {...register("address", { required: true })} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-[13px] font-medium">Known allergies</label>
              <Textarea {...register("known_allergies")} />
            </div>
            <div className="grid gap-2">
              <label className="text-[13px] font-medium">Emergency contact name</label>
              <Input {...register("emergency_contact_name", { required: true })} />
            </div>
            <div className="grid gap-2">
              <label className="text-[13px] font-medium">Emergency contact phone</label>
              <Input {...register("emergency_contact_phone", { required: true })} />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-[13px] font-medium">Aadhaar number (optional)</label>
              <Input {...register("aadhaar_number")} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Register patient"}</Button>
          </div>
        </form>
      </Card>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-medium">Patient created</DialogTitle>
          </DialogHeader>
          {created ? (
            <div className="grid gap-4">
              <div className="text-[14px] text-slate-600">
                Patient ID: <span className="font-medium text-slate-900">{created.patient_id}</span>
              </div>
              <QRCodeDisplay value={created.patient_id} patient={{ patient_id: created.patient_id }} />
              <Button variant="secondary" onClick={() => setSuccessOpen(false)}>
                Close
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

