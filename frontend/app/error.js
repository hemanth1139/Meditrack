"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center p-6">
      <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <span className="text-red-600 text-3xl font-bold">!</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Something went wrong!</h2>
      <p className="text-slate-600 max-w-md">
        An unexpected error occurred. The technical details have been logged.
      </p>
      <Button onClick={() => reset()} className="mt-4">
        Try again
      </Button>
    </div>
  );
}
