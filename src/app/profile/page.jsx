"use client";

import Navbar from "../components/Navbar";
import RoleGuard from "../components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, LogOut, Settings, User, Mail, Phone, Shield, Crown, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Footer from "../components/Footer";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [user, router]);

  // Helper patterns for masking
  const maskEmail = (email) => {
    if (!email) return "—";
    const [local, domain] = email.split("@");
    if (!domain) return email;

    const maskedLocal = local[0] + "****";
    const domainParts = domain.split(".");
    const maskedDomain = domainParts[0][0] + "****";
    const extension = domainParts.length > 1 ? "." + domainParts.slice(1).join(".") : "";

    return `${maskedLocal}@${maskedDomain}${extension}`;
  };

  const maskPhone = (phone) => {
    if (!phone) return "Not Provided";
    const cleaned = String(phone).replace(/\s/g, "");
    if (cleaned.length < 4) return "****";
    return "*******" + cleaned.slice(-4);
  };

  if (!user) return null;

  return (
    <RoleGuard allowedRoles={["ADMIN", "TICKETING", "GATE", "MANAGEMENT", "CUSTOMER"]}>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.back()}
                className="group flex items-center gap-2 px-5 py-2.5 bg-card border-2 border-primary/30 rounded-full text-primary font-bold hover:bg-background-hover hover:border-primary transition-all shadow-lg uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Back</span>
              </button>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-5 py-2.5 text-destructive-foreground font-black hover:bg-destructive/10 rounded-xl transition-all border-2 border-destructive/50 hover:border-destructive uppercase tracking-wider shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar/Profile Identity */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <div className="bg-gradient-to-br from-card to-background rounded-3xl p-8 shadow-xl border-2 border-primary/20 text-center">
                <div className="relative inline-block mb-6">
                  <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-4xl font-black text-primary-foreground ring-4 ring-primary/30 shadow-lg shadow-primary/30 mx-auto">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Crown className="w-6 h-6 text-primary drop-shadow-lg" />
                  </div>
                </div>

                <h1 className="text-2xl font-black text-foreground mb-3 uppercase tracking-wide">{user.name}</h1>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-primary-dark/20 text-primary rounded-full text-xs font-black uppercase tracking-wider border-2 border-primary/40 shadow-lg shadow-primary/10">
                  <Shield className="w-4 h-4" />
                  {user.role}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-gradient-to-br from-card to-background rounded-3xl shadow-xl border-2 border-primary/20 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light flex items-center gap-3 uppercase tracking-wide">
                      <User className="w-6 h-6 text-primary" />
                      Profile Details
                    </h2>
                    <button className="px-4 py-2 text-sm font-bold text-primary hover:text-primary-light transition border-2 border-primary/30 rounded-xl hover:border-primary hover:bg-background-hover uppercase tracking-wider">
                      Edit Profile
                    </button>
                  </div>

                  <div className="space-y-1">
                    <ProfileRow
                      label="Full Name"
                      value={user.name}
                      icon={<User className="w-5 h-5" />}
                    />
                    <ProfileRow
                      label="Email Address"
                      value={maskEmail(user.email)}
                      icon={<Mail className="w-5 h-5" />}
                    />
                    <ProfileRow
                      label="Phone Number"
                      value={maskPhone(user.phone)}
                      icon={<Phone className="w-5 h-5" />}
                    />
                  </div>
                </div>
              </div>

              {/* Preferences/Settings Section */}
              <div className="bg-gradient-to-br from-card to-background rounded-3xl shadow-xl border-2 border-primary/20 overflow-hidden p-6 sm:p-8">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-6 flex items-center gap-3 uppercase tracking-wide">
                  <Settings className="w-6 h-6 text-primary" />
                  Account Settings
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-5 rounded-2xl bg-card-elevated border-2 border-primary/10 hover:border-primary/40 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:shadow-primary/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-foreground group-hover:text-primary transition uppercase tracking-wide">Security</h3>
                      <Shield className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">Manage your password and authentication</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-card-elevated border-2 border-primary/10 hover:border-primary/40 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:shadow-primary/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-foreground group-hover:text-primary transition uppercase tracking-wide">Notifications</h3>
                      <Sparkles className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">Control your email and app alerts</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-card-elevated border-2 border-primary/10 hover:border-primary/40 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:shadow-primary/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-foreground group-hover:text-primary transition uppercase tracking-wide">Privacy</h3>
                      <Shield className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">Manage your data and privacy settings</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-card-elevated border-2 border-primary/10 hover:border-primary/40 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:shadow-primary/10">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-foreground group-hover:text-primary transition uppercase tracking-wide">Preferences</h3>
                      <Settings className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">Customize your experience</p>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-gradient-to-br from-card to-background rounded-3xl shadow-xl border-2 border-primary/20 overflow-hidden p-6 sm:p-8">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-6 uppercase tracking-wide">
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <button className="w-full p-4 rounded-xl bg-card-elevated border-2 border-primary/20 hover:border-primary/50 transition-all text-left group flex items-center justify-between">
                    <span className="font-bold text-foreground group-hover:text-primary uppercase tracking-wide">Change Password</span>
                    <Shield className="w-5 h-5 text-primary" />
                  </button>
                  <button className="w-full p-4 rounded-xl bg-card-elevated border-2 border-primary/20 hover:border-primary/50 transition-all text-left group flex items-center justify-between">
                    <span className="font-bold text-foreground group-hover:text-primary uppercase tracking-wide">Download My Data</span>
                    <User className="w-5 h-5 text-primary" />
                  </button>
                  <button className="w-full p-4 rounded-xl bg-destructive/10 border-2 border-destructive/30 hover:border-destructive/60 transition-all text-left group flex items-center justify-between">
                    <span className="font-bold text-destructive-foreground group-hover:text-destructive uppercase tracking-wide">Delete Account</span>
                    <LogOut className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </RoleGuard>
  );
}

function ProfileRow({ label, value, icon }) {
  return (
    <div className="flex items-center justify-between py-6 border-b-2 border-primary/10 last:border-b-0 group hover:bg-background-hover/30 px-4 rounded-xl transition-all">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-card-elevated text-primary border-2 border-primary/20 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all">
          {icon}
        </div>
        <div>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
          <span className="text-foreground font-bold text-lg">{value || "—"}</span>
        </div>
      </div>
    </div>
  );
}
