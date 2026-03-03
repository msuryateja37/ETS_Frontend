"use client";

import { useState, Suspense } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { resetPassword } = useAuth();

    const [email, setEmail] = useState(searchParams.get("email") || "");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        if (newPassword !== confirmPassword) {
            setStatus("error");
            setMessage("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setStatus("error");
            setMessage("Password must be at least 6 characters");
            return;
        }

        setStatus("loading");
        const res = await resetPassword(email, otp, newPassword);

        if (res.success) {
            setStatus("success");
            setMessage("Password reset successfully. You can now login.");
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } else {
            setStatus("error");
            setMessage(res.error);
        }
    };

    if (status === "success") {
        return (
            <div className="text-center space-y-4">
                <div className="bg-green-50 text-green-700 p-4 rounded">
                    {message}
                </div>
                <p className="text-gray-600">Redirecting to login...</p>
                <Link href="/" className="inline-block text-slate-800 hover:underline">
                    Click here if not redirected
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 sm:text-sm p-2 border"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Verification Code</label>
                <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter the code sent to your email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 sm:text-sm p-2 border"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 sm:text-sm p-2 border"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-slate-800 focus:ring-slate-800 sm:text-sm p-2 border"
                />
            </div>

            {status === "error" && (
                <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
                    {message}
                </div>
            )}

            <button
                type="submit"
                disabled={status === "loading"}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-800 disabled:opacity-50"
            >
                {status === "loading" ? "Resetting..." : "Reset Password"}
            </button>

            <div className="text-center mt-4">
                <Link href="/auth/forgot-password" className="text-sm text-slate-600 hover:text-slate-800">
                    Resend Code
                </Link>
            </div>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Set New Password</h1>
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
