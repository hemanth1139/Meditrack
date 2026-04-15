"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, AlertCircle, Lock } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import api from "@/lib/api";
import toast from "react-hot-toast";

const passwordSchema = z.object({
  old_password: z.string().min(1, "Original password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(1, "Please confirm your password")
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inlineError, setInlineError] = useState("");
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    document.title = "Change Password — MediTrack";
  }, []);

  const forwardToDashboard = (role) => {
    switch (role) {
      case "PATIENT": return router.replace("/dashboard/patient/dashboard");
      case "DOCTOR": return router.replace("/dashboard/doctor/dashboard");
      case "STAFF": return router.replace("/dashboard/staff/dashboard");
      case "HOSPITAL_ADMIN": return router.replace("/dashboard/hospital-admin/dashboard");
      case "ADMIN": return router.replace("/dashboard/admin/dashboard");
      default: return router.replace("/login");
    }
  };

  useEffect(() => {
    // If auth finishes loading and user doesn't need to change password, boot them to dashboard
    if (!loading && user) {
        if (!user.requires_password_change) {
            forwardToDashboard(user.role);
        }
    }
  }, [user, loading]);

  const onSubmit = async (values) => {
    try {
      setInlineError("");
      await api.post("/auth/change-password/", {
        old_password: values.old_password,
        new_password: values.new_password
      });

      toast.success("Password changed securely!");
      
      // Update local storage/cookie state so layout protection lets them through
      import("js-cookie").then((Cookies) => {
        if (user) {
            const updatedUser = { ...user, requires_password_change: false };
            Cookies.default.set("user_data", JSON.stringify(updatedUser), { expires: 1 });
            forwardToDashboard(updatedUser.role);
        } else {
            router.replace("/login");
        }
      });
      
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to change password. Please verify your old password.";
      setInlineError(msg);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading securely...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-opacity-95 font-sans p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative z-10 border border-gray-100">
        
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 shadow-sm mb-4">
            <Lock className="text-red-600 w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Action Required</h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">For security reasons, you must change your temporary admin-provided password before continuing.</p>
        </div>

        {inlineError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-sm font-medium text-red-600 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="pt-0.5">{inlineError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Input 
              label="CURRENT PASSWORD"
              type={showOldPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.old_password?.message}
              {...register("old_password")}
            />
            <button
              type="button"
              onClick={() => setShowOldPassword((v) => !v)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative pt-2">
            <Input 
              label="NEW PASSWORD"
              type={showNewPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.new_password?.message}
              {...register("new_password")}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute right-3 top-[42px] text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input 
              label="CONFIRM NEW PASSWORD"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full h-11 text-base shadow-sm bg-red-600 hover:bg-red-700 font-semibold" 
              loading={isSubmitting}
            >
              Update Password & Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
