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

  const handleAuthSuccess = (data, rememberMe) => {
    setToken(data.access_token);
    setUser(data.user);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("token", data.access_token);
    storage.setItem("user", JSON.stringify(data.user));

    // Cleanup other storage to avoid conflicts
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem("token");
    otherStorage.removeItem("user");
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(updatedUser));
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
      value={{
        user,
        token,
        loading,
        logout,
        updateUser,
        setUser,
        setToken,
        handleAuthSuccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
