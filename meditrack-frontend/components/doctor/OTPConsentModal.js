"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

function Countdown({ seconds }) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return (
    <span className="font-medium text-slate-900">
      {m}:{String(s).padStart(2, "0")}
    </span>
  );
}

export default function OTPConsentModal({ open, onOpenChange, patientId, patientName, homeHospital }) {
  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(5 * 60);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSeconds(5 * 60);
    setOtp("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const i = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (resendCooldown <= 0) return;
    const i = setInterval(() => setResendCooldown((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, [open, resendCooldown]);

  const requestOtp = async () => {
    if (!patientId) return;
    try {
      setSending(true);
      await api.post(`/patients/${patientId}/request-access/`, {
        requesting_hospital_id: 1,
      });
      toast.success("OTP sent");
      setResendCooldown(60);
    } catch (e) {
      const status = e?.response?.status;
      if (!status) toast.error("Connection error. Is the backend running?");
      else toast.error(e?.response?.data?.message || "Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) return toast.error("Enter 6-digit OTP");
    try {
      setVerifying(true);
      await api.post(`/patients/${patientId}/verify-otp/`, { otp });
      toast.success("Access granted");
      onOpenChange(false);
    } catch (e) {
      toast.error("Invalid OTP");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-medium">OTP Consent Required</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="rounded-lg border border-border bg-slate-50 p-3 text-[14px] text-slate-600">
            OTP has been sent to the patient&apos;s registered contact. Ask the patient to share the 6-digit code.
          </div>
          <div className="text-[14px] text-slate-600">
            <span className="font-medium text-slate-900">{patientName}</span> • Home hospital:{" "}
            <span className="font-medium text-slate-900">{homeHospital}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-[14px] text-slate-600">
              Expires in <Countdown seconds={seconds} />
            </div>
            <Button variant="secondary" disabled={sending || resendCooldown > 0} onClick={requestOtp}>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : sending ? "Sending..." : "Resend OTP"}
            </Button>
          </div>
          <div className="grid gap-2">
            <label className="text-[13px] font-medium">6-digit OTP</label>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              autoFocus
              placeholder="123456"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={verifyOtp} disabled={verifying}>
              {verifying ? "Verifying..." : "Submit OTP"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

