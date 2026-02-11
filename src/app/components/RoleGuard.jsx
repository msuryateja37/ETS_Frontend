"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoleGuard({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/");
        return;
      }

      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect to home page if user doesn't have required role
        router.push("/");
      }
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
            <p className="text-red-700">
              You don't have permission to access this page. This page is restricted to: {allowedRoles.join(", ")}.
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

