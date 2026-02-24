"use client";

import { useState, Suspense } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useResetPassword } from "../../../hooks/useAuth";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Shield, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resetPasswordMutation = useResetPassword();

    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (!otp.trim()) {
            setStatus("error");
            setMessage("Please enter the verification code.");
            return;
        }

        if (newPassword.length < 6) {
            setStatus("error");
            setMessage("Password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setStatus("error");
            setMessage("Passwords do not match.");
            return;
        }

        try {
            await resetPasswordMutation.mutateAsync({
                email: email.trim().toLowerCase(),
                otp,
                newPassword
            });
            setStatus("success");
            setMessage("Password reset successfully. Redirecting to login...");
            setTimeout(() => {
                router.push("/auth/login");
            }, 3000);
        } catch (err) {
            setStatus("error");
            setMessage(err.message || "Reset failed. Please try again.");
        }
    };

    if (status === "success") {
        return (
            <div className="space-y-6 text-center">
                <div className="flex justify-center">
                    <div className="p-5 rounded-full bg-primary/10 border-2 border-primary/30">
                        <CheckCircle className="w-10 h-10 text-primary" />
                    </div>
                </div>
                <div className="bg-primary/10 border-2 border-primary/20 text-foreground p-4 rounded-xl text-sm font-bold">
                    {message}
                </div>
                <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
                    Click here if not redirected
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {status === "error" && (
                <div className="bg-destructive/20 border-2 border-destructive/50 text-destructive-foreground p-4 rounded-xl text-sm">
                    <div className="flex items-center gap-2 font-bold">
                        <Shield className="w-4 h-4" />
                        {message}
                    </div>
                </div>
            )}

            <div>
                <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Email Address</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="you@example.com"
                    className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm px-4 py-4 transition-all"
                />
            </div>

            <div>
                <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Verification Code</label>
                <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="000000"
                    className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-xl px-4 py-4 text-center tracking-[0.5em] font-mono transition-all"
                />
            </div>

            <div>
                <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">New Password</label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        minLength={6}
                        placeholder="••••••••"
                        className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm px-4 py-4 pr-12 transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">Minimum 6 characters</p>
            </div>

            <div>
                <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Confirm New Password</label>
                <div className="relative">
                    <input
                        type={showConfirm ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                        placeholder="••••••••"
                        className={`block w-full rounded-xl border-2 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:ring-2 sm:text-sm px-4 py-4 pr-12 transition-all ${confirmPassword && confirmPassword !== newPassword ? 'border-destructive/50 focus:border-destructive focus:ring-destructive/20' : 'border-primary/20 focus:border-primary focus:ring-primary/20'}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-destructive-foreground font-bold mt-1.5">Passwords do not match</p>
                )}
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="w-full flex justify-center py-4 px-4 border-2 border-primary rounded-xl shadow-md shadow-primary/30 text-sm font-black text-primary-foreground bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-wider"
                >
                    {resetPasswordMutation.isPending ? "Resetting Password..." : "Set New Password"}
                </button>
            </div>

            <div className="flex items-center justify-between pt-1">
                <Link href="/auth/forgot-password" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                    Resend Code
                </Link>
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to Login
                </Link>
            </div>
        </form>
    );
}

export default function ResetPasswordPage() {
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
                        Set New Password
                    </h1>
                    <p className="text-muted-foreground font-medium text-sm">
                        Enter the code from your email and choose a new password.
                    </p>
                </div>

                <Suspense fallback={
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
