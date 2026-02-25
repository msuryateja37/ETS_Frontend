"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminHomePage from "../admin/page";
import CustomerHomePage from "../customer/page";
import GateHomePage from "../gate_staff/page";
import ManagementHomePage from "../management/page";

export default function HomePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  // TICKETING staff always live at /pos — redirect immediately
  useEffect(() => {
    if (!loading && user?.role === "TICKETING") {
      router.replace("/pos");
    }
  }, [user, loading, router]);

  // While auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, let app/page.jsx handle auth UI
  if (!user) {
    return null;
  }

  // Role-based rendering
  switch (user.role) {
    case "ADMIN":
      return <AdminHomePage user={user} logout={logout} />;

    case "MANAGEMENT":
      return <ManagementHomePage user={user} logout={logout} />;

    case "CUSTOMER":
      return <CustomerHomePage user={user} logout={logout} />;

    case "TICKETING":
      // Handled by the useEffect above — show spinner while redirecting
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );

    case "GATE":
      return <GateHomePage user={user} logout={logout} />;

    default:
      return null;
  }
}
