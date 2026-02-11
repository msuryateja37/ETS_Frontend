"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fallback to local backend during development when env var isn't set
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URI || 'http://localhost:5000';

  useEffect(() => {
    // Check local storage for token/user on mount
    // Check local storage or session storage for token/user on mount
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    const storedToken = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);

      if (rememberMe) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
      } else {
        sessionStorage.setItem("token", data.access_token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      return { success: true };
    } catch (error) {
      console.error("Login Error:", error);
      return { success: false, error: error.message };
    }
  };

  const requestOtp = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to send OTP");
      }
      return { success: true };
    } catch (error) {
      console.error("Request OTP Error:", error);
      return { success: false, error: error.message };
    }
  };

  const verifyOtp = async (email, otp, name, phone, role = "CUSTOMER") => {
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      };
      if (name?.trim()) payload.name = name.trim();
      if (phone?.trim()) payload.phone = phone.trim();
      if (role) payload.role = role;

      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Invalid OTP");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return { success: true };
    } catch (error) {
      console.error("Verify OTP Error:", error);
      return { success: false, error: error.message };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Request failed");
      }
      return { success: true };
    } catch (error) {
      console.error("Forgot Password Error:", error);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Reset failed");
      }
      return { success: true };
    } catch (error) {
      console.error("Reset Password Error:", error);
      return { success: false, error: error.message };
    }
  };

  const signup = async (userData) => {
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Signup failed");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      return { success: true };
    } catch (error) {
      console.error("Signup Error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, requestOtp, verifyOtp, forgotPassword, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
