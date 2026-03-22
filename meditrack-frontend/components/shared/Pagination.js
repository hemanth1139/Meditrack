"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ current, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
      <div className="flex flex-1 items-center justify-between">
        <div>
          <p className="text-sm text-slate-700">
            Page <span className="font-medium text-slate-900">{current}</span> of <span className="font-medium text-slate-900">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <Button
              variant="outline"
              size="icon"
              className="rounded-l-md rounded-r-none h-9 w-9 bg-white"
              disabled={current <= 1}
              onClick={() => onPageChange(current - 1)}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-l-none rounded-r-md h-9 w-9 bg-white"
              disabled={current >= totalPages}
              onClick={() => onPageChange(current + 1)}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  );
}
