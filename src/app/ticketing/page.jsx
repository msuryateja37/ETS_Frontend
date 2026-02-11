"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Ticket,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import Navbar from "../components/Navbar";

export default function TicketingDashboard() {
  const [stats, setStats] = useState({
    todaySales: "R 12,450.00",
    ticketsSold: 156,
    activeEvents: 8,
    pendingSyncs: 0
  });

  const recentTransactions = [
    { id: "TX-1001", customer: "John Doe", event: "Live Rock Night", amount: "R 450.00", status: "Completed", time: "2 mins ago" },
    { id: "TX-1002", customer: "Jane Smith", event: "Art Expo 2026", amount: "R 200.00", status: "Completed", time: "15 mins ago" },
    { id: "TX-1003", customer: "Bob Wilson", event: "Live Rock Night", amount: "R 900.00", status: "Failed", time: "45 mins ago" },
    { id: "TX-1004", customer: "Alice Brown", event: "Grand Symphony", amount: "R 1,200.00", status: "Completed", time: "1 hour ago" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Navbar />
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Daily Revenue"
          value={stats.todaySales}
          icon={TrendingUp}
          trend="+12.5%"
          trendUp={true}
          color="indigo"
        />
        <StatCard
          title="Tickets Sold"
          value={stats.ticketsSold}
          icon={Ticket}
          trend="+3.2%"
          trendUp={true}
          color="emerald"
        />
        <StatCard
          title="Active Events"
          value={stats.activeEvents}
          icon={Calendar}
          trend="0 change"
          trendUp={true}
          color="amber"
        />
        <StatCard
          title="Customers"
          value="1,240"
          icon={Users}
          trend="+5.1%"
          trendUp={true}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Recent Transactions</h3>
            <Link href="/ticketing/sales" className="text-sm font-bold text-indigo-600 hover:text-indigo-700">View All</Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4">Transaction ID</th>
                  <th className="pb-4">Customer</th>
                  <th className="pb-4">Event</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-bold text-slate-700">{tx.id}</td>
                    <td className="py-4 text-slate-600">{tx.customer}</td>
                    <td className="py-4 text-slate-600">{tx.event}</td>
                    <td className="py-4 font-bold text-slate-900">{tx.amount}</td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${tx.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                        {tx.status === "Completed" ? <CheckCircle2 size={12} className="mr-1" /> : <AlertCircle size={12} className="mr-1" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-slate-400">{tx.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions & Inventory */}
        <div className="space-y-8">
          <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Ticket size={120} />
            </div>
            <h3 className="text-xl font-bold mb-6 relative">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 relative">
              <button className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <Ticket size={20} />
                  </div>
                  <span className="font-bold">Sell Ticket</span>
                </div>
                <ArrowUpRight className="text-white/40 group-hover:text-white transition-colors" />
              </button>
              <button className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <span className="font-bold">New Customer</span>
                </div>
                <ArrowUpRight className="text-white/40 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Inventory Status</h3>
            <div className="space-y-6">
              <InventoryItem name="Live Rock Night" total={500} sold={420} color="indigo" />
              <InventoryItem name="Art Expo 2026" total={1000} sold={350} color="emerald" />
              <InventoryItem name="Grand Symphony" total={300} sold={285} color="rose" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, color }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600"
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${colors[color]}`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center text-xs font-bold ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>
          {trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h4>
      </div>
    </div>
  );
}

function InventoryItem({ name, total, sold, color }) {
  const percentage = Math.round((sold / total) * 100);
  const bgColors = {
    indigo: "bg-indigo-600",
    emerald: "bg-emerald-600",
    rose: "bg-rose-600"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-bold">
        <span className="text-slate-700">{name}</span>
        <span className="text-slate-500">{sold}/{total}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${bgColors[color]} transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}