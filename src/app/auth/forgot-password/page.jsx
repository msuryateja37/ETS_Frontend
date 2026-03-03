"use client";

import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const { forgotPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle, loading, success, error
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setStatus("loading");
        setMessage("");

        const res = await forgotPassword(email);

        if (res.success) {
            setStatus("success");
            setMessage("If an account exists, a code has been sent to your email.");
        } else {
            setStatus("error");
            setMessage(res.error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
                <h1 className="text-2xl font-bold mb-4 text-center">Reset Password</h1>

                {status === "success" ? (
                    <div className="text-center">
                        <div className="bg-green-50 text-green-700 p-4 rounded mb-6">
                            {message}
                        </div>
                        <Link
                            href={`/auth/reset-password?email=${encodeURIComponent(email)}`}
                            className="block w-full text-center py-2 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-900"
                        >
                            Enter Verification Code
                        </Link>
                        <p className="mt-4 text-sm text-gray-600">
                            <Link href="/" className="text-slate-600 hover:text-slate-800">
                                Back to Login
                            </Link>
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <p className="text-gray-600 text-sm mb-4">
                            Enter your email address and we will send you a verification code to reset your password.
                        </p>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                            {status === "loading" ? "Sending..." : "Send Code"}
                        </button>

                        <div className="text-center">
                            <Link href="/" className="text-sm text-slate-600 hover:text-slate-800">
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
