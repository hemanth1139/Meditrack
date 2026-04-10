import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

const cardVariants = {
  default: "bg-white shadow-card border border-border",
  hoverable: "bg-white shadow-card border border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-hover cursor-pointer",
  gradient: "bg-white shadow-card border border-border overflow-hidden",
};

export const Card = forwardRef(({ className, variant = "default", children, headerContent, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl",
        cardVariants[variant],
        className
      )}
      {...props}
    >
      {variant === "gradient" && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
          {headerContent}
        </div>
      )}
      <div className={cn(variant !== "gradient" && "")}>
        {children}
      </div>
    </div>
  );
});
Card.displayName = "Card";
