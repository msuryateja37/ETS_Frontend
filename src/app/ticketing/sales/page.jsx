"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useEvents } from "../../../hooks/useAdmin";
import {
    Search,
    Ticket,
    Users,
    CreditCard,
    Printer,
    ChevronRight,
    Loader2,
    CheckCircle2,
    Calendar,
    MapPin,
    AlertCircle,
    ShoppingCart
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import RoleGuard from "@/app/components/RoleGuard";

export default function TicketSalesPage() {
    return (
        <RoleGuard allowedRoles={["TICKETING", "ADMIN", "MANAGEMENT"]}>
            <TicketSalesContent />
        </RoleGuard>
    );
}


function TicketSalesContent() {
    const { token } = useAuth();
    const [step, setStep] = useState(1); // 1: Event, 2: Seats/Details, 3: Customer, 4: Payment, 5: Confirmation

    const { data: events = [], isLoading: loading, isError } = useEvents();

    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredEvents = events.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Steps Indicator */}
            <div className="flex items-center justify-between px-4">
                {[
                    { n: 1, label: "Event" },
                    { n: 2, label: "Selection" },
                    { n: 3, label: "Customer" },
                    { n: 4, label: "Payment" },
                    { n: 5, label: "Print" }
                ].map((s) => (
                    <div key={s.n} className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md ${step >= s.n ? "bg-indigo-600 text-white" : "bg-white text-slate-400 border border-slate-200"
                            }`}>
                            {step > s.n ? <CheckCircle2 size={18} /> : s.n}
                        </div>
                        {s.n < 5 && (
                            <div className={`w-12 h-1 mx-2 rounded-full ${step > s.n ? "bg-indigo-600" : "bg-slate-200"
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Content Sidebar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="lg:col-span-3">
                    {step === 1 && (
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black text-slate-900">Select Event</h3>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search events..."
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {isError ? (
                                <div className="py-20 flex flex-col items-center justify-center text-red-500">
                                    <AlertCircle className="mb-4" size={40} />
                                    <p>Failed to load events. Please try again.</p>
                                </div>
                            ) : loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="animate-spin mb-4" size={40} />
                                    <p>Loading active events...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredEvents.map(event => (
                                        <button
                                            key={event._id}
                                            onClick={() => {
                                                setSelectedEvent(event);
                                                setStep(2);
                                            }}
                                            className="flex items-center p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-2xl transition-all group text-left"
                                        >
                                            <div className="w-16 h-20 bg-slate-200 rounded-lg overflow-hidden mr-4">
                                                <img src={event.landscapeImage || event.portraitImage} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors uppercase tracking-tight">{event.name}</h4>
                                                <div className="text-xs text-slate-500 space-y-1 mt-1 font-medium">
                                                    <div className="flex items-center"><Calendar size={12} className="mr-1" /> {new Date(event.startDateTime).toLocaleDateString()}</div>
                                                    <div className="flex items-center text-indigo-600"><MapPin size={12} className="mr-1" /> Office Stock</div>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-300 group-hover:text-indigo-400" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
                            <h3 className="text-2xl font-black text-slate-900">Seat Selection</h3>
                            <div className="aspect-[16/9] bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
                                <div className="text-center text-slate-400">
                                    <AlertCircle size={48} className="mx-auto mb-4" />
                                    <p className="font-bold">Interactive Seat Map (Full Integration)</p>
                                    <p className="text-sm">In office mode, specific seats are selected via list or map</p>
                                    <button
                                        onClick={() => setStep(3)}
                                        className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                                    >
                                        Confirm 2 Seats (R 900.00)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
                            <h3 className="text-2xl font-black text-slate-900">Customer Intake</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Search or Enter Name" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="customer@example.com"
                                        onChange={(e) => e.target.value = e.target.value.toLowerCase()}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                    <input type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="+27 000 000 0000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Loyalty ID (Optional)</label>
                                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="LOY-XXXX-XXXX" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setStep(4)}
                                    className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                                >
                                    Proceed to Payment
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8">
                            <h3 className="text-2xl font-black text-slate-900">Payment Processing</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <PaymentMethod icon={CreditCard} name="Card Terminal" active={true} />
                                <PaymentMethod icon={ShoppingCart} name="Cash Payment" />
                                <PaymentMethod icon={Users} name="Loyalty Points" />
                            </div>
                            <div className="p-8 bg-slate-900 text-white rounded-3xl text-center space-y-4">
                                <p className="text-slate-400 font-bold uppercase tracking-widest">Total Amount Due</p>
                                <p className="text-5xl font-black tracking-tighter">R 1,035.00</p>
                                <p className="text-xs text-indigo-400 font-bold">Includes 15% Booking Fee</p>
                            </div>
                            <button
                                onClick={() => setStep(5)}
                                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={24} />
                                Complete Transaction
                            </button>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center space-y-8 animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                <CheckCircle2 size={48} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 mb-2">Success!</h3>
                                <p className="text-slate-500 font-medium">Tickets have been generated and emailed to customer.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                                <button
                                    onClick={() => window.print()}
                                    className="flex items-center justify-center gap-2 p-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                                >
                                    <Printer size={20} />
                                    Print Tickets
                                </button>
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setSelectedEvent(null);
                                    }}
                                    className="flex items-center justify-center gap-2 p-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                                >
                                    New Selection
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Receipt Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-5">
                            <ShoppingCart size={80} />
                        </div>
                        <h4 className="font-black uppercase tracking-widest text-xs text-slate-500 mb-4 relative">Current Order</h4>
                        {selectedEvent ? (
                            <div className="space-y-4 relative">
                                <div className="border-b border-white/10 pb-4">
                                    <p className="font-black text-sm uppercase leading-tight">{selectedEvent.name}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(selectedEvent.startDateTime).toDateString()}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-medium">2x VIP Seats</span>
                                        <span className="font-bold">R 900.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400 font-medium">Booking Fee</span>
                                        <span className="font-bold">R 135.00</span>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-indigo-500/30">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Total</span>
                                        <span className="text-2xl font-black tracking-tighter">R 1,035.00</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center text-slate-600 relative">
                                <Ticket className="mx-auto mb-2 opacity-20" size={32} />
                                <p className="text-sm font-medium">Cart is empty</p>
                            </div>
                        )}
                    </div>

                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Loyalty Card</h4>
                        <div className="space-y-3">
                            <input
                                type="text"
                                placeholder="Scan loyalty card..."
                                className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                            />
                            <p className="text-[10px] text-slate-500 leading-normal">
                                Scanning a loyalty card applies automatic discounts and awards points to the customer profile.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PaymentMethod({ icon: Icon, name, active = false }) {
    return (
        <button className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 text-center ${active
            ? "bg-indigo-50 border-indigo-600 text-indigo-600 shadow-inner"
            : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 shadow-sm"
            }`}>
            <Icon size={32} />
            <span className="font-bold text-sm tracking-tight">{name}</span>
            {active && <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />}
        </button>
    );
}
