"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import { ArrowLeft, UserPlus, Mail, Phone, Shield, Lock, User, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import RoleGuard from "../../../components/RoleGuard";
import Navbar from "../../../components/Navbar";
import Footer from "@/app/components/Footer";

export default function CreateStaffPage() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        role: "TICKETING",
        password: "",
    });
    const [status, setStatus] = useState({ type: null, message: "" });

    const roles = [
        { value: "ADMIN", label: "Administrator", icon: Shield, desc: "Full access to all management features" },
        { value: "TICKETING", label: "Ticketing Agent", icon: Sparkles, desc: "Manage tickets and bookings" },
        { value: "GATE", label: "Gate Staff", icon: Lock, desc: "Ticket verification and entry control" },
        { value: "MANAGEMENT", label: "Management", icon: User, desc: "View reports and event analytics" },
        // { value: "CUSTOMER", label: "Platinum Member", icon: UserPlus, desc: "Personal account for premier access" }
    ];

    const handleChange = (e) => {
        const value = e.target.name === "email" ? e.target.value.toLowerCase() : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: null, message: "" });

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/auth/create-staff`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to create staff member");
            }

            setStatus({ type: "success", message: "Personnel record created successfully! Redirecting..." });
            setTimeout(() => {
                router.push("/admin/users");
            }, 2000);
        } catch (error) {
            console.error("Error creating staff:", error);
            setStatus({ type: "error", message: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <Navbar />

                <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    {/* Header */}
                    <div className="mb-6 relative">
                        <div className="py-4">
                            <button
                                onClick={() => router.back()}
                                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full text-muted-foreground font-medium hover:border-primary/40 hover:text-primary transition-all mb-8 shadow-sm"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                <span>Back</span>
                            </button>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-4">
                                    <h1 className="text-4xl md:text-5xl font-black tracking-tight flex flex-wrap items-center gap-4">
                                        Empower New Staff
                                        {/* <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-base font-bold border border-primary/20">
                                            Registry Entry
                                        </span> */}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-12"> */}
                    {/* Form Section */}
                    <div className="">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="bg-card rounded-3xl border border-border p-8 md:p-12 shadow-xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                <div className="relative z-10 space-y-8">
                                    {/* Name & Email Group */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">
                                                Full Name
                                            </label>
                                            <div className="relative group/field">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                                <input
                                                    required
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Alexander Imperial"
                                                    className="w-full bg-background-elevated border-2 border-border focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-foreground placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">
                                                Email Address
                                            </label>
                                            <div className="relative group/field">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                                <input
                                                    required
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="alexander@imperial.com"
                                                    className="w-full bg-background-elevated border-2 border-border focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-foreground placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phone & Password Group */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">
                                                Phone Number
                                            </label>
                                            <div className="relative group/field">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="+27 82 000 0000"
                                                    className="w-full bg-background-elevated border-2 border-border focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-foreground placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">
                                                Access Password
                                            </label>
                                            <div className="relative group/field">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                                                <input
                                                    required
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    placeholder="••••••••••••"
                                                    className="w-full bg-background-elevated border-2 border-border focus:border-primary rounded-2xl py-4 pl-12 pr-4 outline-none transition-all font-medium text-foreground placeholder:text-muted-foreground/30 focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role Selection */}
                                    <div className="space-y-4 pt-4">
                                        <label className="text-sm font-black uppercase tracking-wider text-muted-foreground ml-1">
                                            Assigned Role & Privileges
                                        </label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {roles.map((item) => (
                                                <label
                                                    key={item.value}
                                                    className={`relative flex items-start gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.role === item.value
                                                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/5 ring-1 ring-primary/20"
                                                        : "bg-background-elevated border-border hover:border-primary/30"
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="role"
                                                        value={item.value}
                                                        checked={formData.role === item.value}
                                                        onChange={handleChange}
                                                        className="sr-only"
                                                    />
                                                    <div className={`p-2.5 rounded-xl ${formData.role === item.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground group-hover:text-primary"} transition-colors shadow-sm`}>
                                                        <item.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className={`block font-bold ${formData.role === item.value ? "text-primary" : "text-foreground"}`}>
                                                            {item.label}
                                                        </span>
                                                        <span className="block text-xs text-muted-foreground leading-relaxed">
                                                            {item.desc}
                                                        </span>
                                                    </div>
                                                    {formData.role === item.value && (
                                                        <div className="absolute top-4 right-4 animate-in fade-in zoom-in duration-300">
                                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                                        </div>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Messages */}
                            {status.message && (
                                <div className={`p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-300 border ${status.type === "success"
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                    : "bg-destructive/10 text-destructive border-destructive/20"
                                    }`}>
                                    {status.type === "success" ? <CheckCircle2 className="w-6 h-6 flex-shrink-0" /> : <AlertCircle className="w-6 h-6 flex-shrink-0" />}
                                    <p className="font-bold">{status.message}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="inline-flex items-center justify-center gap-3 px-12 py-5 bg-primary hover:bg-primary-dark text-primary-foreground rounded-2xl font-black text-lg transition-all shadow-xl hover:shadow-primary/20 hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 min-w-[280px]"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                            <span>Registering...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-6 h-6" />
                                            <span>Finalize Registration</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </main>

                <Footer />
            </div>
        </RoleGuard>
    );
}
