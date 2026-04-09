"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Input } from "@/components/ui/input";
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-50 font-sans">
      {/* Static Background Elements (Optimized for performance) */}
      <div className="pointer-events-none absolute -top-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-300/40 to-indigo-400/20 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-[20%] -left-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-cyan-300/30 to-blue-500/10 blur-[80px]" />
      <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />

      <div 
        
        
        
        className="relative z-10 w-full max-w-[420px] px-4"
      >
        <div  className="mb-8 text-center">
          <div 
            
            
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/30"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-white drop-shadow-md">
              <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z" fill="currentColor" />
            </svg>
          </div>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight text-slate-900 drop-shadow-sm">MediTrack</h1>
          <p className="mt-2 text-[15px] font-medium text-slate-500">Secure Health Records Management</p>
        </div>

        <div 
          
          className="rounded-[24px] border border-white/40 bg-white/70 backdrop-blur-xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 transition-all duration-300 hover:shadow-[0_8px_40px_rgb(37,99,235,0.08)]"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div  className="space-y-2">
              <label className="text-[13px] font-semibold tracking-wide text-slate-700 uppercase">Username or Email</label>
              <div className="group relative">
                <Input
                  placeholder="username or you@example.com"
                  className="h-12 border-slate-200/80 bg-white/50 px-4 text-[15px] shadow-sm transition-all duration-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10 placeholder:text-slate-400"
                  autoComplete="username"
                  {...register("identifier")}
                />
                <div className="absolute inset-0 -z-10 rounded-md bg-gradient-to-br from-blue-500/0 to-indigo-500/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur" />
              </div>
              {errors.identifier && (
                <p   className="text-[13px] font-medium text-red-500">
                  {errors.identifier.message}
                </p>
              )}
            </div>

            <div  className="space-y-2">
              <label className="text-[13px] font-semibold tracking-wide text-slate-700 uppercase">Password</label>
              <div className="group relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-12 border-slate-200/80 bg-white/50 px-4 pr-12 text-[15px] shadow-sm transition-all duration-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-500/10 placeholder:text-slate-400"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  aria-label="Toggle password visibility"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p   className="text-[13px] font-medium text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {inlineError && (
              <div 
                 
                 
                className="rounded-xl bg-red-50/80 border border-red-100 p-4 text-[13px] font-medium text-red-600 shadow-sm"
              >
                {inlineError}
              </div>
            )}

            <div  className="pt-2">
              <button
                
                type="submit"
                disabled={isSubmitting}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:to-indigo-500 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-100" />
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>

            <div  className="pt-4 text-center text-[14px] font-medium text-slate-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-semibold text-blue-600 transition-colors hover:text-blue-700 hover:underline underline-offset-4"
                onClick={() => router.push("/register")}
              >
                Register now
              </button>
            </div>
          </form>
        </div>

        <div  className="mt-8 text-center text-[13px] font-medium text-slate-400">
          © {new Date().getFullYear()} MediTrack. Secure Health Records.
        </div>
      </div>
    </div>
  );
}

