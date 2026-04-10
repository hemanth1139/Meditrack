"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, AlertCircle, Activity } from "lucide-react";
import useAuth from "@/hooks/useAuth";

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or Email is required"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [inlineError, setInlineError] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  useEffect(() => {
    document.title = "Login — MediTrack";
  }, []);

  const onSubmit = async (values) => {
    try {
      setInlineError("");
      const data = await login(values.identifier, values.password);
      const role = data?.role;
      
      const redirectUrl = sessionStorage.getItem("redirectAfterLogin");
      if (redirectUrl) {
        sessionStorage.removeItem("redirectAfterLogin");
        router.push(redirectUrl);
        return;
      }
      
      switch (role) {
        case "PATIENT":
          router.push("/dashboard/patient/dashboard");
          break;
        case "DOCTOR":
          router.push("/dashboard/doctor/dashboard");
          break;
        case "STAFF":
          router.push("/dashboard/staff/dashboard");
          break;
        case "HOSPITAL_ADMIN":
          router.push("/dashboard/hospital-admin/dashboard");
          break;
        case "ADMIN":
          router.push("/dashboard/admin/dashboard");
          break;
        default:
          setInlineError("Invalid email or password. Please try again.");
      }
    } catch (e) {
      const status = e?.response?.status;
      const msg = (e?.response?.data?.message || "").toLowerCase();
      if (msg.includes("not approved") || msg.includes("pending")) {
        setInlineError("Your account is pending approval by your hospital admin.");
        return;
      }
      if (msg.includes("inactive") || msg.includes("deactivated")) {
        setInlineError("Your account has been deactivated. Contact your administrator.");
        return;
      }
      if (status === 400 || status === 401) {
        setInlineError("Invalid email or password. Please try again.");
        return;
      }
      setInlineError("Connection error. Is the backend running?");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 font-sans p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative z-10 border border-gray-100">
        
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-sm mb-4">
            <Activity className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-gray-500 font-medium">Please enter your details to sign in.</p>
        </div>

        {inlineError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-sm font-medium text-red-600 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="pt-0.5">{inlineError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input 
            label="USERNAME OR EMAIL"
            placeholder="Enter your email"
            error={errors.identifier?.message}
            {...register("identifier")}
          />

          <div className="relative">
            <Input 
              label="PASSWORD"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 text-base shadow-sm" 
              loading={isSubmitting}
            >
              Sign In
            </Button>
          </div>

          <div className="pt-4 text-center text-sm font-medium text-gray-500">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              onClick={() => router.push("/register")}
            >
              Register now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
