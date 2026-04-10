"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md border border-transparent",
  secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
  danger: "bg-red-600 text-white hover:bg-red-700 border border-transparent",
  success: "bg-green-600 text-white hover:bg-green-700 border border-transparent",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 border border-transparent",
  icon: "p-2 bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 aspect-square flex items-center justify-center rounded-xl",
};

export const Button = forwardRef(
  ({ className, variant = "primary", size = "default", loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          variant !== "icon" && "px-4 py-2 text-sm",
          variants[variant],
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
