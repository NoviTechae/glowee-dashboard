// app/components/ui/Badge.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "success" | "warning" | "danger" | "info" | "gray";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "gray", size = "md" }: BadgeProps) {
  const variants = {
    primary: "bg-primary-100 text-primary-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
  };

  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
  };

  return (
    <span className={cn("inline-flex items-center rounded-full font-medium", variants[variant], sizes[size])}>
      {children}
    </span>
  );
}