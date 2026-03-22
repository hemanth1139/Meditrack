"use client";

export default function LoadingSpinner({ message }) {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
        {message ? <div className="text-sm text-slate-600">{message}</div> : null}
      </div>
    </div>
  );
}

