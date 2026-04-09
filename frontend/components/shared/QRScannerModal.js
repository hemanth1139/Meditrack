"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { X, Camera, Keyboard } from "lucide-react";

export default function QRScannerModal({ isOpen, onClose, onScan }) {
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const [error, setError] = useState(null);
  const [manualId, setManualId] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [tab, setTab] = useState("camera"); // "camera" | "manual"

  // Stable onScan/onClose refs to avoid re-triggering effect
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Fetch patient preview when 10-digit ID is typed
  const { data: patientPreview, isLoading: isLooking } = useQuery({
    queryKey: ["patientLookup", lookupId],
    queryFn: async () => {
      const res = await api.get(`/patients/lookup/?patient_id=${lookupId}`);
      return res.data;
    },
    enabled: lookupId.length === 10,
    retry: false,
  });

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        html5QrRef.current.stop();
      } catch (e) {}
      html5QrRef.current = null;
    }
    setIsStarted(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (!isOpen || tab !== "camera") return;
    setError(null);

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const codeReader = new BrowserMultiFormatReader();
      
      const controls = await codeReader.decodeFromVideoDevice(
        undefined, 
        "qr-reader-direct", 
        (result, err) => {
          if (result) {
            const decodedText = result.getText();
            let patientId = decodedText.trim();
            if (decodedText.includes("/qr/")) {
              patientId = decodedText.split("/qr/")[1].trim();
            } else if (decodedText.includes("/patient/")) {
              patientId = decodedText.split("/patient/")[1].trim();
            } else {
              try {
                const data = JSON.parse(decodedText);
                if (data.patient_id) patientId = data.patient_id;
              } catch (_) {}
            }
            controls.stop();
            onScanRef.current(patientId);
            onCloseRef.current();
          }
        }
      );
      
      html5QrRef.current = controls;

      setIsStarted(true);
    } catch (err) {
      console.error("QR start error:", err);
      if (err?.name === "NotAllowedError" || String(err).includes("permission")) {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err?.name === "NotFoundError" || String(err).includes("No camera")) {
        setError("No camera available. Use manual ID entry below.");
      } else {
        setError("Could not start camera. Use manual ID entry below.");
      }
    }
  }, [isOpen, tab, stopScanner]);

  // Start camera when modal opens on camera tab
  useEffect(() => {
    let t;
    if (isOpen && tab === "camera") {
      // Loop until DOM element exists, then start
      const checkElement = () => {
        if (document.getElementById("qr-reader-direct")) {
          startScanner();
        } else {
          t = setTimeout(checkElement, 50);
        }
      };
      checkElement();
    }
    return () => {
      clearTimeout(t);
      stopScanner();
    };
  }, [isOpen, tab, startScanner, stopScanner]);

  // Stop scanner when modal closes
  useEffect(() => {
    if (!isOpen) stopScanner();
  }, [isOpen, stopScanner]);

  const handleIdChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setManualId(value);
    setLookupId(value.length === 10 ? value : "");
  };

  const handleManualSubmit = () => {
    if (manualId.trim().length === 10) {
      onScan(manualId.trim());
      onClose();
    }
  };

  const handleTabChange = async (newTab) => {
    if (newTab === tab) return;
    await stopScanner();
    setManualId("");
    setLookupId("");
    setError(null);
    setTab(newTab);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-5 pt-5 pb-3">
          <h2 className="text-lg font-bold text-slate-800">Find Patient</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 p-1.5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 mx-5 mb-0">
          <button
            onClick={() => handleTabChange("camera")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === "camera"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Camera size={14} /> Scan QR
          </button>
          <button
            onClick={() => handleTabChange("manual")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === "manual"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Keyboard size={14} /> Enter ID
          </button>
        </div>

        <div className="p-5">
          {tab === "camera" ? (
            <div>
              {error ? (
                <div className="text-center p-5 bg-red-50 rounded-xl border border-red-100">
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                  <button
                    onClick={() => { setError(null); startScanner(); }}
                    className="mt-3 text-xs text-blue-600 underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-900 flex items-center justify-center min-h-[260px] relative">
                  <video id="qr-reader-direct" className="w-full" />
                  {!isStarted && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span className="text-xs">Starting camera...</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-center text-xs text-slate-400 mt-3">
                Point your camera at a patient&apos;s QR code
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider block mb-2">
                  Patient ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter 10-digit Patient ID"
                    maxLength={10}
                    value={manualId}
                    onChange={handleIdChange}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                    className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 transition-all font-mono"
                  />
                  <Button
                    onClick={handleManualSubmit}
                    disabled={manualId.length !== 10}
                    className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 px-5"
                  >
                    Go
                  </Button>
                </div>
              </div>

              {/* Patient preview */}
              {lookupId.length === 10 && (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  {isLooking ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                      <p className="text-sm text-slate-500">Looking up patient...</p>
                    </div>
                  ) : patientPreview?.full_name ? (
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-base border border-green-200">
                        {patientPreview.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{patientPreview.full_name}</p>
                        <p className="text-xs text-slate-500 font-mono">Blood: {patientPreview.blood_group || "—"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-500">
                      <X size={14} />
                      <p className="text-sm font-medium">Patient not found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
