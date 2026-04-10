"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import usePatients from "@/hooks/usePatients";

const formSchema = z.object({
  address: z.string().min(5, "Address must be at least 5 characters"),
  emergency_contact_name: z.string().min(2, "Name required"),
  emergency_contact_phone: z.string().min(10, "Valid phone required"),
  blood_group: z.string().min(1, "Blood group required"),
  known_allergies: z.string().optional(),
});

export default function PatientOnboardingModal({ isOpen, onSuccess }) {
  const { completeProfile, isCompletingProfile } = usePatients();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      blood_group: "",
      known_allergies: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      if (!data.known_allergies) data.known_allergies = "None";
      await completeProfile(data);
      onSuccess();
    } catch (e) {}
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Cannot close until completed
      title="Complete Your Profile"
      footer={
        <div className="w-full flex justify-end">
          <Button type="submit" form="onboarding-form" disabled={isCompletingProfile} loading={isCompletingProfile}>
            Save Profile
          </Button>
        </div>
      }
    >
      <form id="onboarding-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
        <p className="text-sm text-gray-500 mb-4">
          Please provide your emergency contact and medical details to continue using MediTrack.
        </p>

        <div className="space-y-4">
          <Input 
            label="Blood Group" 
            placeholder="e.g. O+, A-, B+" 
            error={errors.blood_group?.message} 
            {...register("blood_group")} 
          />
          <div className="flex flex-col gap-1.5 w-full">
             <label className="text-sm font-medium text-gray-700">Home Address</label>
             <textarea 
               {...register("address")} 
               className={`flex w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]`} 
             />
             {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Emergency Contact Name" 
              placeholder="Name" 
              error={errors.emergency_contact_name?.message} 
              {...register("emergency_contact_name")} 
            />
            <Input 
              label="Emergency Contact Phone" 
              placeholder="Phone number" 
              error={errors.emergency_contact_phone?.message} 
              {...register("emergency_contact_phone")} 
            />
          </div>

          <Input 
            label="Known Allergies (Optional)" 
            placeholder="e.g. Penicillin, Peanuts (or leave blank)" 
            {...register("known_allergies")} 
          />
        </div>
      </form>
    </Modal>
  );
}
