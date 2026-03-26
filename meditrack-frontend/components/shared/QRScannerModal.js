"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function QRScannerModal({ isOpen, onClose, onScan }) {
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const html5QrCode = new Html5Qrcode("qr-reader");
    scannerRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success
          html5QrCode.stop().then(() => {
            let patientId = decodedText;
            try {
              // Try parsing as JSON (old format)
              const data = JSON.parse(decodedText);
              if (data.patient_id) patientId = data.patient_id;
            } catch (e) {
              // Extract from URL if new format: http://.../qr/12345
              const match = decodedText.match(/\/qr\/([A-Za-z0-9]+)/);
              if (match) patientId = match[1];
            }
            onScan(patientId);
            onClose();
          }).catch((err) => {
            console.error("Error stopping scanner", err);
          });
        },
        (errorMessage) => {
          // Parse errors (ignorable mostly, happens when no QR in view)
        }
      )
      .catch((err) => {
        setError("Camera permission denied or camera not found.");
        setCameraError(true);
        console.error(err);
      });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-800">Scan Patient QR Code</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          {error ? (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 mb-4">
              {error}
            </div>
          ) : null}
          <div className="overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
            {cameraError ? (
              <div className="flex flex-col gap-3 p-4">
                <p className="text-red-500 text-sm">
                  Camera access denied
                </p>
                <input
                  type="text"
                  placeholder="Enter 10-digit Patient ID manually"
                  maxLength={10}
                  className="border rounded-lg p-2 text-sm w-full"
                  onChange={(e) => {
                    if (e.target.value.length === 10) {
                      onScan(e.target.value);
                      onClose();
                    }
                  }}
                />
              </div>
            ) : (
              <div id="qr-reader" className="w-full" />
            )}
          </div>
          
          <div className="mt-4 text-center text-sm text-slate-500">
            Position the QR code within the frame to scan automatically.
          </div>
        </div>
        
        <div className="border-t bg-slate-50 px-5 py-4 sm:flex sm:flex-row-reverse">
          <Button onClick={onClose} variant="secondary" className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
