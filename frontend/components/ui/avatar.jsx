import React from "react";
import { cn } from "@/lib/utils";

const sizeVariants = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

const getColorFromInitial = (initial) => {
  if (!initial) return "bg-gray-200 text-gray-700";
  const charCode = initial.toUpperCase().charCodeAt(0);
  if (charCode >= 65 && charCode <= 69) return "bg-blue-100 text-blue-700"; // A-E
  if (charCode >= 70 && charCode <= 74) return "bg-green-100 text-green-700"; // F-J
  if (charCode >= 75 && charCode <= 79) return "bg-amber-100 text-amber-700"; // K-O
  if (charCode >= 80 && charCode <= 84) return "bg-purple-100 text-purple-700"; // P-T
  return "bg-rose-100 text-rose-700"; // U-Z & others
};

export function Avatar({ className, size = "md", src, name, ...props }) {
  const initial = name ? name.charAt(0).toUpperCase() : "?";
  const colorClass = getColorFromInitial(initial);

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium border border-white shadow-sm",
        sizeVariants[size],
        colorClass,
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="aspect-square h-full w-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
