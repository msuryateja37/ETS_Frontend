"use client";

import React from "react";
import {
    Download,
    TrendingUp,
    BarChart3,
    PieChart,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    FileText
} from "lucide-react";

export default function ReportingPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900">Performance Analytics</h3>
                    <p className="text-sm text-slate-500 font-medium">Sales data from <span className="font-bold">Feb 01</span> to <span className="font-bold">Feb 28, 2026</span></p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Calendar size={18} />
                        Custom Range
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                        <Download size={18} />
                        Export Data
                    </button>
                </div>
            </div>

            {/* Top Summaries */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportStatCard title="Total Revenue" value="R 48,250.00" trend="+18.4%" trendUp={true} color="indigo" />
                <ReportStatCard title="Average Order" value="R 312.40" trend="-2.1%" trendUp={false} color="amber" />
                <ReportStatCard title="Checkout Success" value="94.2%" trend="+0.5%" trendUp={true} color="emerald" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Chart Placeholders */}
                <ChartPlaceholder
                    title="Revenue Over Time"
                    icon={TrendingUp}
                    content="Monthly revenue growth visualization with trend lines."
                />
                <ChartPlaceholder
                    title="Sales by Category"
                    icon={PieChart}
                    content="Breakdown of ticket sales across Music, Sports, and Cinema."
                />
            </div>

            {/* Detailed Reports List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-sm">System Reports</h4>
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder="Search reports..." className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600" />
                        </div>
                        <button className="p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-200">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-y divide-slate-100">
                    <ReportFileItem title="Daily Sales Summary" description="Total tickets and revenue generated today." type="PDF" size="1.2 MB" />
                    <ReportFileItem title="Inventory Status Report" description="Current seating availability for all active events." type="Excel" size="4.8 MB" />
                    <ReportFileItem title="Financial Reconciliation" description="Detailed transaction log for management review." type="PDF" size="12.4 MB" />
                    <ReportFileItem title="Customer Loyalty Trends" description="Analysis of points earned and redeemed this month." type="CSV" size="0.5 MB" />
                </div>
            </div>
        </div>
    );
}

function ReportStatCard({ title, value, trend, trendUp, color }) {
    const bgColors = {
        indigo: "bg-indigo-600",
        amber: "bg-amber-500",
        emerald: "bg-emerald-600"
    };

    return (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:translate-y-[-2px] transition-all">
            <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <span className={`flex items-center text-xs font-bold ${trendUp ? "text-emerald-600" : "text-amber-600"}`}>
                    {trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                    {trend}
                </span>
            </div>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">{value}</h4>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${bgColors[color]} w-[70%] opacity-50`} />
            </div>
        </div>
    );
}

function ChartPlaceholder({ title, icon: Icon, content }) {
    return (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Icon size={20} className="text-indigo-600" />
                    {title}
                </h3>
                <button className="text-slate-400 hover:text-slate-900 p-2">
                    <Download size={18} />
                </button>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center p-8">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                    <BarChart3 size={32} className="text-slate-300" />
                </div>
                <p className="text-slate-600 font-bold mb-2">Interactive Visualization API</p>
                <p className="text-sm text-slate-400 max-w-xs">{content}</p>
            </div>
        </div>
    );
}

function ReportFileItem({ title, description, type, size }) {
    return (
        <div className="p-6 hover:bg-slate-50 transition-colors group">
            <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${type === 'PDF' ? 'bg-rose-50 text-rose-600' :
                        type === 'Excel' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-indigo-50 text-indigo-600'
                    }`}>
                    <FileText size={24} />
                </div>
                <div className="flex-grow">
                    <h5 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h5>
                    <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                    <div className="mt-3 flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">{type}</span>
                        <span className="text-[10px] text-slate-400 font-bold">{size}</span>
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline ml-auto">Download</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
