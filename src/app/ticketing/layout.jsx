"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleGuard from "../components/RoleGuard";
import {
    LayoutDashboard,
    Ticket,
    Users,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/ticketing" },
    { name: "Ticket Sales", icon: Ticket, href: "/ticketing/sales" },
    { name: "Customers", icon: Users, href: "/ticketing/customers" },
    { name: "Reports", icon: BarChart3, href: "/ticketing/reports" },
    { name: "Settings", icon: Settings, href: "/ticketing/settings" },
];

export default function TicketingLayout({ children }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    return (
        <RoleGuard allowedRoles={["TICKETING", "ADMIN"]}>
            <div className="min-h-screen bg-slate-50 flex">
                {/* Sidebar */}
                <aside
                    className={`${isSidebarOpen ? "w-64" : "w-20"
                        } bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-50`}
                >
                    <div className="p-6 flex items-center justify-between border-b border-slate-800">
                        {isSidebarOpen && (
                            <span className="font-black text-xl tracking-tighter text-indigo-400">TICKETING</span>
                        )}
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                    <nav className="flex-grow py-6 space-y-1 px-3">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                            : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }`}
                                >
                                    <Icon size={20} className={isActive ? "text-white" : "group-hover:text-white"} />
                                    {isSidebarOpen && <span className="font-medium">{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-slate-800">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all group"
                        >
                            <LogOut size={20} />
                            {isSidebarOpen && <span className="font-medium">Logout</span>}
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main
                    className={`flex-grow transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"
                        }`}
                >
                    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 sticky top-0 z-40">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-slate-900">
                                {NAV_ITEMS.find(item => item.href === pathname)?.name || "Ticketing Office"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-900">{user?.name || "Staff Member"}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-wider">{user?.role || "Staff"}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-indigo-100 flex items-center justify-center font-bold text-indigo-600">
                                {user?.name?.[0] || "S"}
                            </div>
                        </div>
                    </header>

                    <div className="p-8">
                        {children}
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
