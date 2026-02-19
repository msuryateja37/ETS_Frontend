"use client";

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import Link from "next/link";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            setStatus("error");
            setMessage("Please enter a valid email address.");
            return;
        }

        setStatus("loading");
        setMessage("");

        const res = await forgotPassword(trimmed);

        if (res.success) {
            setStatus("success");
            setMessage("If an account exists with this email, a verification code has been sent.");
        } else {
            setStatus("error");
            setMessage(res.error || "Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
            <div className="bg-gradient-to-br from-card to-background shadow-2xl rounded-3xl p-10 w-full max-w-md border-2 border-primary/20">

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark rounded-full blur-xl opacity-40 animate-pulse" />
                        <div className="relative bg-gradient-to-br from-card to-card-elevated p-5 rounded-full border-2 border-primary/30 shadow-xl shadow-primary/20">
                            <img src="/icon.png" alt="Logo" className="w-16 h-16 object-contain" />
                        </div>
                    </div>
                </div>

                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light tracking-tight uppercase mb-2">
                        Forgot Password
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">
                        Enter your email and we'll send you a verification code.
                    </p>
                </div>

                {status === "success" ? (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="p-5 rounded-full bg-primary/10 border-2 border-primary/30">
                                <CheckCircle className="w-10 h-10 text-primary" />
                            </div>
                        </div>
                        <div className="bg-primary/10 border-2 border-primary/20 text-foreground p-4 rounded-xl text-sm font-bold">
                            {message}
                        </div>
                        <Link
                            href={`/auth/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                            className="flex w-full justify-center py-4 px-4 border-2 border-primary rounded-xl shadow-md shadow-primary/30 text-sm font-black text-primary-foreground bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary transition-all uppercase tracking-wider"
                        >
                            Enter Verification Code
                        </Link>
                        <Link
                            href="/auth/login"
                            className="flex items-center justify-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {status === "error" && (
                            <div className="bg-destructive/20 border-2 border-destructive/50 text-destructive-foreground p-4 rounded-xl text-sm">
                                <div className="flex items-center gap-2 font-bold">
                                    <Shield className="w-4 h-4" />
                                    {message}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    placeholder="you@example.com"
                                    className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm pl-11 pr-4 py-4 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full flex justify-center py-4 px-4 border-2 border-primary rounded-xl shadow-md shadow-primary/30 text-sm font-black text-primary-foreground bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-wider"
                        >
                            {status === "loading" ? "Sending Code..." : "Send Verification Code"}
                        </button>

                        <div className="text-center">
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
