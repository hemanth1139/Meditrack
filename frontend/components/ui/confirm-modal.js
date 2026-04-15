import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  confirmText, 
  expectedKeyword, 
  onConfirm, 
  destructive = true,
  loading = false
}) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (isOpen) setTyped("");
  }, [isOpen]);

  const isValid = typed === expectedKeyword;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button 
            className={destructive ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            disabled={!isValid || loading} 
            loading={loading}
            onClick={() => {
              if (isValid) onConfirm();
            }}
          >
            {confirmText || "Confirm"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-2">
        <p className="text-sm text-gray-600 font-medium leading-relaxed">
          {description}
        </p>
        <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg border border-red-100">
          This action is sensitive and has system-wide impacts.
        </div>
        <div className="pt-2">
          <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
            Type <span className="font-extrabold text-gray-900 select-all tracking-wider py-0.5 px-1 bg-gray-100 rounded">{expectedKeyword}</span> to confirm
          </label>
          <Input 
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={expectedKeyword}
            className="font-mono text-sm"
            disabled={loading}
          />
        </div>
      </div>
    </Modal>
  );
}
