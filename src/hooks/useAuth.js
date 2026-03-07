"use client";

import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URI || 'http://localhost:5000';

const authFetcher = async (url, options = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Auth action failed: ${res.statusText}`);
    }
    return res.json();
};

export const useLogin = () => {
    const { handleAuthSuccess } = useAuth();

    return useMutation({
        mutationFn: (credentials) =>
            authFetcher(`${API_BASE}/auth/login`, {
                method: "POST",
                body: JSON.stringify(credentials),
            }),
        onSuccess: (data, variables) => {
            handleAuthSuccess(data, variables.rememberMe);
        }
    });
};

export const useVerifyOtp = () => {
    const { handleAuthSuccess } = useAuth();

    return useMutation({
        mutationFn: (payload) =>
            authFetcher(`${API_BASE}/auth/verify-otp`, {
                method: "POST",
                body: JSON.stringify(payload),
            }),
        onSuccess: (data, variables) => {
            handleAuthSuccess(data, variables.rememberMe);
        }
    });
};

export const useSignup = () => {
    const { handleAuthSuccess } = useAuth();

    return useMutation({
        mutationFn: (userData) =>
            authFetcher(`${API_BASE}/auth/signup`, {
                method: "POST",
                body: JSON.stringify(userData),
            }),
        onSuccess: (data) => {
            handleAuthSuccess(data, true);
        }
    });
};

export const useRequestOtp = () => {
    return useMutation({
        mutationFn: (email) =>
            authFetcher(`${API_BASE}/auth/send-otp`, {
                method: "POST",
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            }),
    });
};

export const useForgotPassword = () => {
    return useMutation({
        mutationFn: (email) =>
            authFetcher(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                body: JSON.stringify({ email }),
            }),
    });
};

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (payload) =>
            authFetcher(`${API_BASE}/auth/reset-password`, {
                method: "POST",
                body: JSON.stringify(payload),
            }),
    });
};

export const useRequestContactUpdate = () => {
    const { token, user } = useAuth();
    return useMutation({
        mutationFn: ({ newContact, type }) =>
            authFetcher(`${API_BASE}/user/${user._id}/request-contact-update`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ newContact, type }),
            }),
    });
};

export const useVerifyContactUpdate = () => {
    const { token, user, updateUser } = useAuth();
    return useMutation({
        mutationFn: ({ otp, newContact, type }) =>
            authFetcher(`${API_BASE}/user/${user._id}/verify-contact-update`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ otp, newContact, type }),
            }),
        onSuccess: (data) => {
            if (data?.user) {
                updateUser(data.user);
            } else if (data && !data.user && typeof data === 'object') {
                // If the backend returns the updated user directly
                updateUser(data);
            }
        }
    });
};
