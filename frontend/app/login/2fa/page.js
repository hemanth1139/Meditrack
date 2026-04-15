"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogIn, AlertCircle } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function TwoFactorAuthPage() {
  const router = useRouter();
  const { verify2FA } = useAuth();
  
  const [tempToken, setTempToken] = useState("");
  const [isSetup, setIsSetup] = useState(true);
  const [qrCode, setQrCode] = useState("");
  const [manualSecret, setManualSecret] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingSetup, setFetchingSetup] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    document.title = "2FA Verification — MediTrack";
    
    // Check session
    const tk = sessionStorage.getItem("2fa_temp_token");
    const setupStatus = sessionStorage.getItem("2fa_is_setup") === "true";
    
    if (!tk) {
      toast.error("Authentication session missing or expired.");
      router.replace("/login");
      return;
    }
    
    setTempToken(tk);
    setIsSetup(setupStatus);
    
    if (!setupStatus) {
      loadSetupData(tk);
    }
  }, [router]);
  
  const loadSetupData = async (activeToken) => {
    try {
      setFetchingSetup(true);
      const res = await api.post("/auth/2fa/setup/", { temp_token: activeToken });
      setQrCode(res.data.data.qr_code);
      setManualSecret(res.data.data.secret);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load 2FA setup");
    } finally {
      setFetchingSetup(false);
    }
  };
  
  const forwardToDashboard = (role, needsPassChange) => {
      if (needsPassChange) {
          router.replace("/change-password");
          return;
      }
      switch (role) {
        case "PATIENT": return router.replace("/dashboard/patient/dashboard");
        case "DOCTOR": return router.replace("/dashboard/doctor/dashboard");
        case "STAFF": return router.replace("/dashboard/staff/dashboard");
        case "HOSPITAL_ADMIN": return router.replace("/dashboard/hospital-admin/dashboard");
        case "ADMIN": return router.replace("/dashboard/admin/dashboard");
        default: return router.replace("/login");
      }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    
    try {
      setLoading(true);
      setError("");
      const userData = await verify2FA(tempToken, code);
      sessionStorage.removeItem("2fa_temp_token");
      sessionStorage.removeItem("2fa_is_setup");
      
      toast.success("Identity verified securely.");
      forwardToDashboard(userData.role, userData.requires_password_change);
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid authentication code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!tempToken) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 bg-opacity-95 font-sans p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative z-10 border border-gray-100">
        
        <div className="mb-6 text-center flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 shadow-sm mb-4">
            <ShieldAlert className="text-blue-600 w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Two-Factor Auth</h1>
          <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed">
            {isSetup 
              ? "Your account is protected. Please enter the 6-digit code from Google Authenticator."
              : "Secure your admin account by completing mandatory 2FA setup via Google Authenticator or Authy."}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 p-4 text-sm font-medium text-red-600 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {!isSetup && (
          <div className="mb-6 flex flex-col items-center bg-gray-50 rounded-xl p-4 border border-gray-200">
            {fetchingSetup ? (
              <div className="h-40 flex items-center text-sm font-medium text-gray-500">Generating secure QR Code...</div>
            ) : qrCode ? (
              <>
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48 mix-blend-multiply border rounded shadow-sm" />
                <p className="mt-4 text-xs font-mono text-gray-500 text-center tracking-widest bg-gray-200 px-3 py-1.5 rounded w-full overflow-hidden break-all">
                  {manualSecret}
                </p>
                <p className="mt-2 text-xs text-gray-400 text-center">Scan the QR code or manually enter the key above.</p>
              </>
            ) : null}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <Input 
            autoFocus
            label="AUTHENTICATION CODE"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{ fontSize: "1.5rem", letterSpacing: "0.25em", textAlign: "center", padding: "1.25rem" }}
          />

          <div className="pt-2 flex gap-3">
             <Button 
              type="button" 
              variant="outline"
              className="h-11"
              onClick={() => {
                sessionStorage.clear();
                router.replace("/login");
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-11 text-base shadow-sm font-semibold" 
              loading={loading}
              disabled={code.length !== 6}
            >
              Verify Token <LogIn className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
