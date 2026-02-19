"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Crown, Shield } from "lucide-react";

export default function AuthLoginPage() {
  const { user, loading, login, signup, requestOtp, verifyOtp } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [useOtp, setUseOtp] = useState(true);
  const [otpStep, setOtpStep] = useState("email");
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    otp: "",
    role: "CUSTOMER",
  });
  const [error, setError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // If already logged in, redirect to home
  useEffect(() => {
    if (user && !loading) {
      router.replace("/");
    }
  }, [user, loading, router]);

  const handleChange = (e) => {
    const value = e.target.name === "email" ? e.target.value.toLowerCase() : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        return "Name is required";
      }
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        return "Phone number must be exactly 10 digits";
      }
      if (formData.password.length < 6) {
        return "Password must be at least 6 characters long";
      }
      if (formData.password !== formData.confirmPassword) {
        return "Passwords do not match";
      }
    } else {
      if (!formData.password && !useOtp) {
        return "Password is required";
      }
    }
    return null;
  };

  const handlePasswordSubmit = async () => {
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    let res;
    if (isLogin) {
      res = await login(formData.email, formData.password, rememberMe);
    } else {
      const { confirmPassword, ...signupData } = formData;
      res = await signup(signupData);
    }
    if (!res.success) {
      setError(res.error);
    } else {
      router.push("/");
    }
  };

  const handleSendOtp = async () => {
    setError("");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!isLogin && !formData.name.trim()) {
      setError("Enter your name to sign up");
      return;
    }

    setOtpLoading(true);
    const res = await requestOtp(formData.email);
    setOtpLoading(false);
    if (res.success) {
      setOtpStep("verify");
      setFormData((prev) => ({ ...prev, otp: "" }));
    } else {
      setError(res.error);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (!formData.otp.trim()) {
      setError("Enter the code from your email");
      return;
    }
    setOtpLoading(true);
    const res = await verifyOtp(
      formData.email,
      formData.otp,
      formData.name,
      formData.phone,
      formData.role,
      rememberMe
    );
    setOtpLoading(false);
    if (!res.success) {
      setError(res.error);
    } else {
      router.push("/");
    }
  };

  const switchToEmailStep = () => {
    setOtpStep("email");
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary font-semibold tracking-wide">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-background overflow-hidden font-sans">
      {/* Left Side: Premium Branding */}
      <div className="md:w-1/2 h-full bg-gradient-to-br from-background via-card to-background-elevated flex flex-col justify-center items-center p-12 text-foreground relative overflow-hidden shrink-0">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="absolute inset-0 border-2 border-primary/10 m-8 rounded-3xl"></div>

        <div className="relative z-10 text-center space-y-10 max-w-md">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-card to-card-elevated p-8 rounded-full backdrop-blur-sm border-2 border-primary/30 shadow-2xl shadow-primary/20">
                <img
                  src="/icon.png"
                  alt="Emperors Palace Logo"
                  className="w-32 h-32 object-contain"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary"></div>
              <Crown className="w-8 h-8 text-primary" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary"></div>
            </div>

            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-light to-primary">
                EMPERORS
              </span>
              <br />
              <span className="text-muted-foreground">PALACE</span>
            </h1>

            <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary-dark mx-auto rounded-full shadow-md shadow-primary/50"></div>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed px-4">
              Experience the pinnacle of event entertainment. Secure your place at the most exclusive venues.
            </p>
          </div>

          {/* Features */}
          <div className="pt-8 grid grid-cols-2 gap-8">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold border-r border-primary/20 pr-2">Premium Seats</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Exclusive Events</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Forms */}
      <div className="md:w-1/2 h-full overflow-y-auto flex items-center justify-center p-8 bg-background-elevated">
        <main className="bg-gradient-to-br from-card to-background shadow-2xl rounded-3xl p-10 w-full max-w-md border-2 border-primary/20 transition-all duration-300 my-auto">
          <div className="mb-10 text-center md:hidden">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center border-2 border-primary/30">
              <img src="/icon.png" alt="Logo" className="w-10 h-10" />
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light tracking-tight uppercase">
              {isLogin ? "Welcome Back" : "Join Us"}
            </h1>
            <p className="text-muted-foreground font-medium">
              {isLogin ? "Enter your credentials to continue" : "Create your exclusive account"}
            </p>
          </div>

          <div className="flex rounded-xl border-2 border-primary/20 p-1.5 mb-8 bg-card-elevated">
            <button
              type="button"
              onClick={() => {
                setUseOtp(true);
                setOtpStep("email");
                setError("");
              }}
              className={`flex-1 py-3 text-sm font-black rounded-lg transition-all duration-200 uppercase tracking-wider ${useOtp
                ? "bg-gradient-to-r from-primary to-primary-dark shadow-md text-primary-foreground border-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Email OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setUseOtp(false);
                setError("");
              }}
              className={`flex-1 py-3 text-sm font-black rounded-lg transition-all duration-200 uppercase tracking-wider ${!useOtp
                ? "bg-gradient-to-r from-primary to-primary-dark shadow-md text-primary-foreground border-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Password
            </button>
          </div>

          {error && (
            <div className="bg-destructive/20 border-2 border-destructive/50 text-destructive-foreground p-4 rounded-xl mb-6 text-sm">
              <div className="flex items-center gap-2 font-bold">
                <Shield className="w-4 h-4" />
                {error}
              </div>
            </div>
          )}

          {useOtp ? (
            <div className="space-y-6">
              {otpStep === "email" ? (
                <>
                  {!isLogin && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm p-4 transition-all"
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm p-4 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={otpLoading}
                    className="w-full flex justify-center py-4 px-4 border-2 border-primary rounded-xl shadow-md shadow-primary/30 text-sm font-black text-primary-foreground bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-wider"
                  >
                    {otpLoading ? "Sending Code..." : "Send Verification Code"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground bg-card-elevated p-4 rounded-xl border-2 border-primary/10">
                    We've sent a 6-digit code to <strong className="text-primary">{formData.email}</strong>
                  </p>
                  <div>
                    <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Verification Code</label>
                    <input
                      type="text"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      placeholder="000 000"
                      maxLength={6}
                      className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-xl p-5 text-center tracking-[0.5em] font-mono transition-all"
                    />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all ${rememberMe ? 'bg-primary border-primary' : 'border-primary/30 bg-card-elevated group-hover:border-primary/60'}`}>
                        {rememberMe && (
                          <svg className="w-3 h-3 text-primary-foreground absolute top-0.5 left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Keep me signed in</span>
                  </label>

                  <button
                    onClick={handleVerifyOtp}
                    disabled={otpLoading || formData.otp.length < 6}
                    className="w-full flex justify-center py-4 px-4 border-2 border-primary rounded-xl shadow-md shadow-primary/30 text-sm font-black text-primary-foreground bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-[0.98] disabled:opacity-50 uppercase tracking-wider"
                  >
                    {otpLoading ? "Verifying..." : "Verify & Sign In"}
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm p-4 transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm p-4 transition-all"
                />
              </div>

              <div className="relative">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black text-primary uppercase tracking-widest">Password</label>
                  {isLogin && (
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
                    >
                      Forgot Password?
                    </Link>
                  )}
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="block w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 sm:text-sm p-4 transition-all"
                />
              </div>

              {isLogin && (
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 transition-all ${rememberMe ? 'bg-primary border-primary' : 'border-primary/30 bg-card-elevated group-hover:border-primary/60'}`}>
                      {rememberMe && (
                        <svg className="w-3 h-3 text-primary-foreground absolute top-0.5 left-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">Keep me signed in</span>
                </label>
              )}

              <div className="pt-2">
                <button
                  onClick={handlePasswordSubmit}
                  className="w-full flex justify-center py-4 px-4 border-2 border-primary rounded-xl shadow-md shadow-primary/30 text-sm font-black text-primary-foreground bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-[0.98] uppercase tracking-wider"
                >
                  {isLogin ? "Sign In" : "Create Account"}
                </button>
              </div>
            </div>
          )}

          <div className="mt-10 pt-8 border-t-2 border-primary/10 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setOtpStep("email");
                setError("");
              }}
              className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center justify-center gap-2 mx-auto transition-colors"
            >
              <span>{isLogin ? "New to Emperor's Palace?" : "Already have an account?"}</span>
              <span className="text-primary font-black uppercase tracking-wider">{isLogin ? "Sign Up" : "Sign In"}</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}