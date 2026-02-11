"use client";

import { useAuth } from "../context/AuthContext";
import HomePage from "../app/home/page";
import CustomerHomePage from "../app/customer/page";

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary font-semibold tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is logged in, use the role-based HomePage
  if (user) {
    return <HomePage user={user} logout={logout} />;
  }

  // If no user, show the Customer view as a landing page
  return <CustomerHomePage user={null} logout={logout} />;
}
