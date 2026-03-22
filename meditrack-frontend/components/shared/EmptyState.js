"use client";

import { Button } from "@/components/ui/button";

function EmptyIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <rect x="6" y="10" width="32" height="24" rx="6" stroke="#E2E8F0" strokeWidth="2" />
      <path d="M14 18h16" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 24h10" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-white p-10 shadow-card">
      <EmptyIcon />
      <div className="mt-4 text-base font-medium text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{description}</div>
      {actionLabel ? (
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

