"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, Keyboard, X } from "lucide-react";

export default function QRScannerModal({ isOpen, onClose, onScan }) {
  const html5QrRef = useRef(null);
  const [error, setError] = useState(null);
  const [manualId, setManualId] = useState("");
  const [lookupId, setLookupId] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [tab, setTab] = useState("camera"); // "camera" | "manual"

  // Stable onScan/onClose refs to avoid re-triggering effect
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  // Fetch patient preview when 10-digit ID is typed
  const { data: patientPreview, isLoading: isLooking } = useQuery({
    queryKey: ["patientLookup", lookupId],
    queryFn: async () => {
      const res = await api.get(`/patients/lookup/?patient_id=${lookupId}`);
      return res.data?.data || res.data;
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
            onClose();
          }
        }
      );
      
      html5QrRef.current = controls;

      setIsStarted(true);
    } catch (err) {
      if (err?.name === "NotAllowedError" || String(err).includes("permission")) {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err?.name === "NotFoundError" || String(err).includes("No camera")) {
        setError("No camera available. Use manual ID entry below.");
      } else {
        setError("Could not start camera. Use manual ID entry below.");
      }
    }
  }, [isOpen, tab, stopScanner, onClose]);

  // Start camera when modal opens on camera tab
  useEffect(() => {
    let t;
    if (isOpen && tab === "camera") {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Find Patient"
      footer={
        <div className="w-full flex justify-end">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="-mx-6 border-b border-gray-100 flex mb-4 px-6">
        <button
          onClick={() => handleTabChange("camera")}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold transition-colors relative ${
            tab === "camera"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Camera size={14} /> Scan QR
          {tab === "camera" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button
          onClick={() => handleTabChange("manual")}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold transition-colors relative ml-4 ${
            tab === "manual"
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Keyboard size={14} /> Enter ID
          {tab === "manual" && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
      </div>

      <div className="py-2">
        {tab === "camera" ? (
          <div>
            {error ? (
              <div className="text-center py-6 bg-red-50 rounded-xl border border-red-100 mb-2">
                <p className="text-red-500 text-sm font-medium">{error}</p>
                <button
                  onClick={() => { setError(null); startScanner(); }}
                  className="mt-3 text-xs text-blue-600 underline font-medium"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-900 flex items-center justify-center min-h-[260px] relative mb-2">
                <video id="qr-reader-direct" className="w-full object-cover" />
                {!isStarted && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 gap-3">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span className="text-xs font-medium tracking-wide">Starting camera...</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-center text-xs text-gray-400 font-medium pb-2">
              Point your camera at a patient&apos;s QR code to scan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  label="Patient ID"
                  placeholder="Enter 10-digit ID"
                  maxLength={10}
                  value={manualId}
                  onChange={handleIdChange}
                  onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                  autoFocus
                />
              </div>
              <Button
                onClick={handleManualSubmit}
                disabled={manualId.length !== 10}
              >
                Go
              </Button>
            </div>

            {/* Patient preview */}
            {lookupId.length === 10 && (
              <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                {isLooking ? (
                  <div className="flex items-center gap-2 text-gray-500 font-medium text-sm">
                    <div className="h-4 w-4 rounded-full border-2 border-gray-200 border-t-blue-500 animate-spin" />
                    Looking up patient...
                  </div>
                ) : patientPreview?.full_name ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold border border-green-200 shrink-0">
                      {patientPreview.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{patientPreview.full_name}</p>
                      <p className="text-xs text-gray-500 font-medium">Blood Group: {patientPreview.blood_group || "—"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-500 font-medium text-sm">
                    <X size={16} />
                    Patient not found. Check the ID.
                  </div>
                )}
              </div>
            )}
            <div className="h-4" /> {/* Spacer */}
          </div>
        )}
      </div>
    </Modal>
  );
}
