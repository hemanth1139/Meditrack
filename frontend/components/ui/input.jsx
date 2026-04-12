"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef(
  ({ className, label, error, success, id, disabled, ...props }, ref) => {
    return (
      <div className="w-full relative flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "text-sm font-medium",
              disabled ? "text-gray-400" : "text-gray-700"
            )}
          >
            {label}
          </label>
        )}
        <input
          {...props}
          id={id}
          ref={ref}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full rounded-xl border border-gray-300 bg-white px-2 sm:px-3 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500",
            error && "border-red-500 focus:ring-red-500 focus:border-red-500",
            success && "border-green-500 focus:ring-green-500 focus:border-green-500",
            className
          )}
        />
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
