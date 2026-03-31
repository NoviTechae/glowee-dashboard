// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getRole, logout, isTokenExpired } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

useEffect(() => {
  const checkAuth = () => {
    try {
      if (!isAuthenticated()) {
        router.replace("/login");
        return;
      }

      if (isTokenExpired()) {
        console.log("Token expired, logging out...");
        logout();
        router.replace("/login");
        return;
      }

      const role = getRole();
      console.log("User role:", role);

      if (role === "admin") {
        router.replace("/admin");
      } else if (role === "salon") {
        router.replace("/salon");
      } else {
        console.log("Invalid role, logging out...");
        logout();
        router.replace("/login");
      }
    } catch (error) {
      console.error("Auth check error:", error);
      logout();
      router.replace("/login");
    }
  };

  checkAuth();
}, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Redirecting...</p>
      </div>
    </div>
  );
}