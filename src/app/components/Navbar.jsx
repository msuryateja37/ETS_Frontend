"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { Home, Search, Ticket, Heart, Settings, Users, LogOut, MessageCircle, MessageSquare, Sparkles, Star } from "lucide-react";
import Image from "next/image";

export default function Navbar({ showSearch = false, searchQuery, setSearchQuery, onSearch }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  const handleNavigation = (path) => {
    router.push(path);
  };

  // Admin navigation items
  const adminNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Users, label: "Users", path: "/admin/users" },
    { icon: Sparkles, label: "Events", path: "/admin/events" },
    { icon: Ticket, label: "Analytics", path: "/admin/analytics" },
  ];

  // Customer navigation items
  const customerNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Ticket, label: "My Tickets", path: "/customer/tickets" },
    { icon: Heart, label: "Likes", path: "/customer/likes"},
    { icon: Star, label: "Favorites", path: "/customer/favorites" },
    { icon: MessageCircle, label: "Contact Us", path: "/customer/contactus" },
  ];

  // Ticketing navigation items
  const ticketingNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Ticket, label: "Tickets", path: "/ticketing/sales" },
  ];

  // Gate navigation items
  const gateNavItems = [
    { icon: Home, label: "Home", path: "/" },
  ];

  // Management navigation items
  const managementNavItems = [
    { icon: Home, label: "Home", path: "/" },
  ];

  // Get navigation items based on role
  const getNavItems = () => {
    switch (user.role) {
      case "ADMIN":
        return adminNavItems;
      case "CUSTOMER":
        return customerNavItems;
      case "TICKETING":
        return ticketingNavItems;
      case "GATE":
        return gateNavItems;
      case "MANAGEMENT":
        return managementNavItems;
      default:
        return [{ icon: Home, label: "Home", path: "/" }];
    }
  };

  const navItems = user ? getNavItems() : [{ icon: Home, label: "Home", path: "/" }];

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-background border-b border-primary/30 sticky top-0 z-50 transition-all duration-300">
        <div className="relative w-full h-20 px-6 flex items-center justify-between max-w-[1920px] mx-auto">

          {/* LEFT — Logo */}
          <div className="flex items-center gap-3 w-[200px]">
            <div className="relative w-36 h-18 cursor-pointer" onClick={() => router.push('/')}>
              <Image
                src="/EP_Logo_nobg.png"
                alt="Emperors Palace Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>

          {/* CENTER — Nav Items */}
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8 bg-background px-6 py-2 rounded-full border border-border-light backdrop-blur-sm">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`group relative flex items-center gap-2 text-sm font-bold transition-all duration-200 uppercase tracking-tight
                    ${active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                    }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                  <span>{item.label}</span>

                  {/* Gold Underline Indicator */}
                  {active && (
                    <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-full h-0.5 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.4)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* RIGHT — Search & Profile */}
          <div className="flex items-center gap-4 w-[auto] justify-end">

            {/* Search Bar (Conditional) */}
            {showSearch && (
              <div className="hidden lg:flex items-center relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-muted transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && onSearch && onSearch()}
                  placeholder="Search events..."
                  className="w-64 pl-10 pr-4 py-2 bg-card hover:bg-background-hover focus:bg-background-hover border border-primary/20 focus:border-primary rounded-full text-sm text-foreground placeholder-muted-foreground focus:outline-none transition-all duration-300"
                />
              </div>
            )}

            <div className="h-6 w-px bg-border-light mx-1 hidden lg:block"></div>

            {user ? (
              <button
                onClick={() => router.push("/profile")}
                className="flex items-center gap-3 pl-1 pr-1 py-1 rounded-full hover:bg-card transition-all group"
              >
                <div className="w-9 h-9 flex items-center justify-center rounded-full
                          bg-primary text-primary-foreground text-sm font-bold
                          group-hover:bg-primary-light transition border border-primary shadow-lg shadow-primary/20">
                  {(user?.name?.[0] || "U").toUpperCase()}
                </div>
              </button>
            ) : (
              <button
                onClick={() => router.push("/auth/login")}
                className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-full hover:bg-primary-light transition-all shadow-lg shadow-primary/20 uppercase tracking-wider"
              >
                Sign in/Sign Up
              </button>
            )}
          </div>


        </div>
      </nav>

      {/* Bottom Navigation Bar - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-primary/30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-50 safe-area-bottom">
        <div className="grid grid-cols-4 gap-1 p-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`flex flex-col items-center py-2.5 rounded-lg transition-colors ${active
                  ? "text-primary bg-card"
                  : "text-muted-foreground hover:text-foreground active:bg-card"
                  }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${active ? "fill-current" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
