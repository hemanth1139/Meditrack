"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    } catch (e) {
      // handled by usePatients
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[500px]" 
        onInteractOutside={(e) => e.preventDefault()} 
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Please provide your emergency contact and medical details to continue using MediTrack.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Blood Group</Label>
            <Input {...register("blood_group")} placeholder="e.g. O+, A-, B+" />
            {errors.blood_group && <span className="text-xs text-red-500">{errors.blood_group.message}</span>}
          </div>

          <div className="space-y-2">
            <Label>Home Address</Label>
            <Textarea {...register("address")} placeholder="Full address" />
            {errors.address && <span className="text-xs text-red-500">{errors.address.message}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Emergency Contact Name</Label>
              <Input {...register("emergency_contact_name")} placeholder="Name" />
              {errors.emergency_contact_name && <span className="text-xs text-red-500">{errors.emergency_contact_name.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Emergency Contact Phone</Label>
              <Input {...register("emergency_contact_phone")} placeholder="Phone number" />
              {errors.emergency_contact_phone && <span className="text-xs text-red-500">{errors.emergency_contact_phone.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Known Allergies (Optional)</Label>
            <Input {...register("known_allergies")} placeholder="e.g. Penicillin, Peanuts (or leave blank)" />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isCompletingProfile} className="w-full sm:w-auto">
              {isCompletingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
