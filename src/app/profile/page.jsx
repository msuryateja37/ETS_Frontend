"use client";
import Navbar from "../components/Navbar";
import RoleGuard from "../components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, LogOut, Settings, User, Mail, Phone, Shield, Crown, Sparkles, Edit2, Check, X, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Footer from "../components/Footer";

export default function ProfilePage() {
  const { user, token, loading, logout, updateUser, requestContactUpdate, verifyContactUpdate } = useAuth();
  const router = useRouter();

  // Basic editing state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    address: user?.address || "",
  });

  // Contact update state (Email/Phone)
  const [contactModal, setContactModal] = useState({
    isOpen: false,
    type: "email", // 'email' or 'phone'
    currentValue: "",
    newValue: "",
    otp: "",
    step: 1, // 1: request, 2: verify
    loading: false,
    error: ""
  });

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URI || 'http://localhost:5000';

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/");
      } else {
        setFormData({
          name: user.name || "",
          address: user.address || "",
        });
      }
    }
  }, [user, loading, router]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset if canceling
      setFormData({
        name: user.name || "",
        address: user.address || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/user/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await res.json();
      updateUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Save Error:", error);
      alert(error.message);
    }
  };

  const openContactModal = (type) => {
    setContactModal({
      ...contactModal,
      isOpen: true,
      type,
      currentValue: type === 'email' ? user.email : user.phone,
      newValue: "",
      otp: "",
      step: 1,
      error: ""
    });
  };

  const handleRequestOTP = async () => {
    const type = contactModal.type;
    const newValue = contactModal.newValue.trim();

    // Client-side validation
    if (!newValue) {
      setContactModal(prev => ({ ...prev, error: `Please enter a new ${type}.` }));
      return;
    }

    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newValue)) {
        setContactModal(prev => ({ ...prev, error: 'Please enter a valid email address.' }));
        return;
      }
      if (newValue === user.email) {
        setContactModal(prev => ({ ...prev, error: 'New email must be different from your current email.' }));
        return;
      }
    }

    if (type === 'phone') {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(newValue)) {
        setContactModal(prev => ({ ...prev, error: 'Phone number must be exactly 10 digits.' }));
        return;
      }
      if (newValue === user.phone) {
        setContactModal(prev => ({ ...prev, error: 'New phone number must be different from your current phone number.' }));
        return;
      }
    }

    setContactModal(prev => ({ ...prev, loading: true, error: '' }));
    const result = await requestContactUpdate(newValue, type);
    if (result.success) {
      setContactModal(prev => ({ ...prev, step: 2, loading: false }));
    } else {
      setContactModal(prev => ({ ...prev, error: result.error, loading: false }));
    }
  };

  const handleVerifyOTP = async () => {
    setContactModal(prev => ({ ...prev, loading: true, error: "" }));
    const result = await verifyContactUpdate(contactModal.otp, contactModal.newValue, contactModal.type);
    if (result.success) {
      setContactModal(prev => ({ ...prev, isOpen: false, loading: false }));
    } else {
      setContactModal(prev => ({ ...prev, error: result.error, loading: false }));
    }
  };

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
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={handleProfileSave}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-dark transition shadow-lg uppercase tracking-wider text-xs"
                          >
                            <Check className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={handleEditToggle}
                            className="flex items-center gap-2 px-4 py-2 bg-card border-2 border-destructive/50 text-destructive-foreground rounded-xl font-bold hover:bg-destructive/10 transition uppercase tracking-wider text-xs"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handleEditToggle}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary hover:text-primary-light transition border-2 border-primary/30 rounded-xl hover:border-primary hover:bg-background-hover uppercase tracking-wider"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <ProfileRow
                      label="Full Name"
                      isEditing={isEditing}
                      value={isEditing ? (
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full bg-background/50 border-2 border-primary/20 rounded-xl px-4 py-2 focus:border-primary transition-all outline-none font-bold text-foreground"
                        />
                      ) : user.name}
                      icon={<User className="w-5 h-5" />}
                    />
                    <ProfileRow
                      label="Email Address"
                      value={
                        <div className="flex items-center justify-between w-full">
                          <span>{maskEmail(user.email)}</span>
                          <button
                            onClick={() => openContactModal('email')}
                            className="text-xs font-black text-primary hover:underline uppercase tracking-tighter"
                          >
                            Change
                          </button>
                        </div>
                      }
                      icon={<Mail className="w-5 h-5" />}
                    />

                    <ProfileRow
                      label="Phone Number"
                      value={
                        <div className="flex items-center justify-between w-full">
                          <span>{maskPhone(user.phone)}</span>
                          <button
                            onClick={() => openContactModal('phone')}
                            className="text-xs font-black text-primary hover:underline uppercase tracking-tighter"
                          >
                            Change
                          </button>
                        </div>
                      }
                      icon={<Phone className="w-5 h-5" />}
                    />

                    <ProfileRow
                      label="Address"
                      isEditing={isEditing}
                      value={isEditing ? (
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full bg-background/50 border-2 border-primary/20 rounded-xl px-4 py-2 focus:border-primary transition-all outline-none font-bold text-foreground resize-none h-24"
                        />
                      ) : user.address}
                      icon={<MapPin className="w-5 h-5" />}
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
                  {[
                    { title: "Security", icon: Shield, desc: "Manage password and MFA" },
                    { title: "Notifications", icon: Sparkles, desc: "Control email alerts" },
                    { title: "Privacy", icon: Shield, desc: "Manage data settings" },
                    { title: "Preferences", icon: Settings, desc: "Customize experience" }
                  ].map((item, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-card-elevated border-2 border-primary/10 hover:border-primary/40 transition-all cursor-pointer group shadow-lg hover:shadow-xl hover:shadow-primary/10">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-foreground group-hover:text-primary transition uppercase tracking-wide">{item.title}</h3>
                        <item.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
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
                  <button
                    className="w-full p-4 rounded-xl bg-destructive/10 border-2 border-destructive/30 hover:border-destructive/60 transition-all text-left group flex items-center justify-between"
                  >
                    <span className="font-bold text-destructive-foreground group-hover:text-destructive uppercase tracking-wide">Delete Account</span>
                    <LogOut className="w-5 h-5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Update Modal */}
        {contactModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-md rounded-3xl border-2 border-primary/30 shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-primary uppercase tracking-wide">
                  Change {contactModal.type === 'email' ? 'Email' : 'Phone'}
                </h3>
                <button onClick={() => setContactModal({ ...contactModal, isOpen: false })} className="text-muted-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {contactModal.error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive-foreground text-sm font-bold">
                    {contactModal.error}
                  </div>
                )}

                {contactModal.step === 1 ? (
                  <>
                    <div>
                      <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Current {contactModal.type}</label>
                      <div className="p-3 bg-muted rounded-xl text-muted-foreground font-bold border border-primary/10">
                        {contactModal.currentValue || "Not Set"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">New {contactModal.type}</label>
                      <input
                        type={contactModal.type === 'email' ? 'email' : 'text'}
                        placeholder={contactModal.type === 'email' ? 'you@example.com' : '10-digit phone number'}
                        value={contactModal.newValue}
                        onChange={(e) => {
                          const val = contactModal.type === 'email' ? e.target.value.toLowerCase() : e.target.value.replace(/\D/g, '').slice(0, 10);
                          setContactModal({ ...contactModal, newValue: val, error: '' });
                        }}
                        maxLength={contactModal.type === 'phone' ? 10 : undefined}
                        inputMode={contactModal.type === 'phone' ? 'numeric' : 'email'}
                        className="w-full bg-background border-2 border-primary/20 rounded-xl px-4 py-3 focus:border-primary transition-all outline-none font-bold text-foreground"
                      />
                    </div>
                    <button
                      onClick={handleRequestOTP}
                      disabled={contactModal.loading || !contactModal.newValue}
                      className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:bg-primary-dark transition shadow-lg disabled:opacity-50"
                    >
                      {contactModal.loading ? "Sending OTP..." : "Get Verification Code"}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-center text-muted-foreground font-bold">
                      We've sent a code to <span className="text-primary">{contactModal.newValue}</span>
                    </p>
                    <div>
                      <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Enter Verification Code</label>
                      <input
                        type="text"
                        placeholder="6-digit code"
                        maxLength={6}
                        value={contactModal.otp}
                        onChange={(e) => setContactModal({ ...contactModal, otp: e.target.value })}
                        className="w-full bg-background border-2 border-primary/20 rounded-xl px-4 py-3 focus:border-primary transition-all outline-none font-bold text-foreground text-center text-2xl tracking-[0.5em]"
                      />
                    </div>
                    <button
                      onClick={handleVerifyOTP}
                      disabled={contactModal.loading || contactModal.otp.length < 4}
                      className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:bg-primary-dark transition shadow-lg disabled:opacity-50"
                    >
                      {contactModal.loading ? "Verifying..." : "Verify & Update"}
                    </button>
                    <button
                      onClick={() => setContactModal({ ...contactModal, step: 1 })}
                      className="w-full text-xs font-bold text-primary hover:underline uppercase tracking-widest"
                    >
                      Change New {contactModal.type}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </RoleGuard>
  );
}

function ProfileRow({ label, value, icon, isEditing }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-6 border-b-2 border-primary/10 last:border-b-0 group hover:bg-background-hover/30 px-4 rounded-xl transition-all ${isEditing ? 'bg-background-hover/20' : ''}`}>
      <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full sm:w-1/3">
        <div className="p-3 rounded-xl bg-card-elevated text-primary border-2 border-primary/20 group-hover:border-primary/40 group-hover:bg-primary/10 transition-all shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{label}</p>
        </div>
      </div>
      <div className="flex-1 w-full text-foreground font-bold text-lg">
        {value || <span className="text-muted-foreground/50">—</span>}
      </div>
    </div>
  );
}
