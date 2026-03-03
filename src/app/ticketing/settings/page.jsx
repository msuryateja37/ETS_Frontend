"use client";

import React, { useState } from "react";
import {
    Printer,
    Settings,
    ShieldCheck,
    RefreshCcw,
    Bell,
    Smartphone,
    HardDrive,
    Database,
    CheckCircle2,
    AlertCircle,
    Activity,
    ChevronRight,
    LogOut
} from "lucide-react";

export default function SettingsPage() {
    const [printerStatus, setPrinterStatus] = useState("Online");
    const [isTesting, setIsTesting] = useState(false);

    const handleTestPrint = () => {
        setIsTesting(true);
        setTimeout(() => setIsTesting(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* System Overview Header */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Activity size={100} />
                </div>
                <div className="relative space-y-4">
                    <h3 className="text-2xl font-black">Ticketing Environment</h3>
                    <div className="flex flex-wrap gap-8 pt-4">
                        <div className="space-y-1">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Printer Link</p>
                            <p className="flex items-center gap-2 font-bold text-emerald-400">
                                <CheckCircle2 size={16} /> Connected (USB-001)
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Database</p>
                            <p className="flex items-center gap-2 font-bold text-indigo-400">
                                <ShieldCheck size={16} /> Synchronized
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">App Version</p>
                            <p className="font-bold">v2.4.1-ticketing</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Printer Management */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                            <Printer size={24} />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Printer Hardware</h4>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                            <div>
                                <p className="font-bold text-slate-900">Zebra ZD421 Label</p>
                                <p className="text-xs text-slate-500">Default Perforated Ticket Printer</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase">Online</span>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Ticket Stock Height</p>
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 w-3/4" />
                            </div>
                            <p className="text-[10px] text-slate-500 text-right font-bold">~150 tickets remaining</p>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={handleTestPrint}
                                disabled={isTesting}
                                className="flex-grow py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isTesting ? <RefreshCcw size={18} className="animate-spin" /> : <Printer size={18} />}
                                {isTesting ? "Testing..." : "Perform Test Print"}
                            </button>
                            <button className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600">
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notifications & Prefs */}
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                            <Bell size={24} />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Notifications</h4>
                    </div>

                    <div className="space-y-4">
                        <ToggleItem label="Low Stock Alerts" desc="Notify when tickets are under 50 units." checked={true} />
                        <ToggleItem label="Payment Failures" desc="Immediate alert on terminal errors." checked={true} />
                        <ToggleItem label="Daily Sales Report" desc="Email summary at 11:59 PM nightly." checked={false} />
                        <ToggleItem label="Management Approvals" desc="Request sign-off for R1000+ orders." checked={true} />
                    </div>
                </div>
            </div>

            {/* General Settings List */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Account & Security</h4>
                </div>
                <div className="divide-y divide-slate-100">
                    <SettingsOption icon={HardDrive} label="Ticket Templates" desc="Edit visual layout of printed tickets." />
                    <SettingsOption icon={Smartphone} label="Terminal Pairing" desc="Manage connected card processing units." />
                    <SettingsOption icon={Database} label="Offline Sync Mapping" desc="Configure local cache for network failures." />
                    <SettingsOption icon={LogOut} label="Emergency Lockout" desc="Revoke all active station sessions immediately." danger={true} />
                </div>
            </div>
        </div>
    );
}

function ToggleItem({ label, desc, checked }) {
    return (
        <div className="flex items-start justify-between p-2">
            <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">{label}</p>
                <p className="text-xs text-slate-400 leading-normal max-w-[200px]">{desc}</p>
            </div>
            <button className={`w-12 h-6 rounded-full transition-all relative ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${checked ? 'left-7' : 'left-1'}`} />
            </button>
        </div>
    );
}

function SettingsOption({ icon: Icon, label, desc, danger = false }) {
    return (
        <button className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon size={20} />
                </div>
                <div className="text-left">
                    <p className={`font-bold ${danger ? 'text-rose-600' : 'text-slate-900'} group-hover:text-indigo-600 transition-colors`}>{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
            </div>
            <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
        </button>
    );
}
