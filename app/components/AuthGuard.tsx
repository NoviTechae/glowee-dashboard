// app/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getRole } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: "admin" | "salon";
}

export function AuthGuard({ children, requireRole }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
useEffect(() => {
  const checkAuth = () => {
    const justLoggedOut = sessionStorage.getItem("justLoggedOut");

    if (justLoggedOut) {
      setIsLoading(false); // ✅ مهم
      router.replace("/login");
      return;
    }

    if (!isAuthenticated()) {
      setIsLoading(false); // ✅ مهم
      router.replace("/login");
      return;
    }

    if (requireRole) {
      const userRole = getRole();

      if (userRole !== requireRole) {
        setIsLoading(false); // ✅ مهم

        if (userRole === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/salon");
        }
        return;
      }
    }

    setIsAuthorized(true);
    setIsLoading(false);
  };

  checkAuth();
}, []);
  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authorized (will redirect)
  if (!isAuthorized) {
    return null;
  }

  // Render children if authorized
  return <>{children}</>;
}