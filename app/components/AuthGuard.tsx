// app/components/AuthGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getRole } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole?: "admin" | "salon_owner";
}

export function AuthGuard({ children, requireRole }: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ✅ Check auth only once on mount
    const checkAuth = () => {
      // Check if logged out flag exists
      const justLoggedOut = sessionStorage.getItem('justLoggedOut');
      if (justLoggedOut) {
        router.replace("/login");
        return;
      }

      // Check authentication
      if (!isAuthenticated()) {
        router.replace("/login");
        return;
      }

      // Check role if required
      if (requireRole) {
        const userRole = getRole();
        if (userRole !== requireRole) {
          // Redirect to appropriate dashboard
          if (userRole === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/salon");
          }
          return;
        }
      }

      // All checks passed
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, []); // ✅ Empty array - run once only

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