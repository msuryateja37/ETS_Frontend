"use client";

import React, { useState, useEffect } from "react";
import {
    Clock,
    Search,
    UserPlus,
    Filter,
    MoreVertical,
    Mail,
    Phone,
    CreditCard,
    ChevronRight,
    Star,
    History
} from "lucide-react";

export default function CustomerManagementPage() {
    const [customers, setCustomers] = useState([
        { id: "CUST-001", name: "John Doe", email: "john@example.com", phone: "+27 82 000 0000", tickets: 12, loyalty: "Gold", lastPurchase: "2 days ago" },
        { id: "CUST-002", name: "Jane Smith", email: "jane@world.com", phone: "+27 71 111 1111", tickets: 5, loyalty: "Silver", lastPurchase: "1 week ago" },
        { id: "CUST-003", name: "Alpha Centauri", email: "alpha@star.co", phone: "+27 60 222 2222", tickets: 28, loyalty: "Platinum", lastPurchase: "Today" },
        { id: "CUST-004", name: "Sarah Connor", email: "sarah@future.com", phone: "+27 84 333 3333", tickets: 1, loyalty: "None", lastPurchase: "Never" },
    ]);

    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-grow max-w-xl">
                    <div className="relative flex-grow">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm">
                        <Filter size={20} className="text-slate-600" />
                    </button>
                </div>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                    <UserPlus size={20} />
                    Add Customer
                </button>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 text-left text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                            <th className="px-8 py-5">Customer Profile</th>
                            <th className="px-8 py-5">Contact Info</th>
                            <th className="px-8 py-5">Loyalty</th>
                            <th className="px-8 py-5 text-center">Owned Tickets</th>
                            <th className="px-8 py-5">Last Activity</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {customers.map((cust) => (
                            <tr key={cust.id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg shadow-sm">
                                            {cust.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{cust.name}</p>
                                            <p className="text-xs text-slate-400 font-mono">{cust.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center text-sm text-slate-600 gap-2">
                                            <Mail size={14} className="text-slate-400" />
                                            {cust.email}
                                        </div>
                                        <div className="flex items-center text-sm text-slate-600 gap-2">
                                            <Phone size={14} className="text-slate-400" />
                                            {cust.phone}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${cust.loyalty === "Platinum" ? "bg-slate-900 text-slate-100" :
                                        cust.loyalty === "Gold" ? "bg-amber-100 text-amber-700" :
                                            cust.loyalty === "Silver" ? "bg-slate-200 text-slate-700" :
                                                "bg-slate-100 text-slate-400"
                                        }`}>
                                        <Star size={12} className={cust.loyalty !== "None" ? "fill-current" : ""} />
                                        {cust.loyalty}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-900 font-bold text-sm">
                                        {cust.tickets}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                        <Clock size={14} className="text-slate-400" />
                                        {cust.lastPurchase}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View History">
                                            <History size={18} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                                            <MoreVertical size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination / Summary */}
            <div className="flex items-center justify-between text-sm text-slate-500 px-4">
                <p>Showing <strong>4</strong> of <strong>1,240</strong> customers</p>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Previous</button>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold">Next Page</button>
                </div>
            </div>
        </div>
    );
}
