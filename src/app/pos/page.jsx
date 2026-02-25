"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import RoleGuard from "../components/RoleGuard";
import Navbar from "../components/Navbar";
import {
    LayoutDashboard,
    Ticket,
    Clock,
    TrendingUp,
    Banknote,
    CreditCard,
    Smartphone,
    Users,
    Search,
    RefreshCw,
    LogOut,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    XCircle,
    Activity,
    Calendar,
    MapPin,
    Monitor,
    PlusCircle,
    BarChart3,
    Timer,
    Zap,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URI || "http://localhost:5000";

// ─────────────────────────────────────────────────────────────
// Utility fetcher
// ─────────────────────────────────────────────────────────────
async function apiFetch(url, token, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed: ${res.statusText}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const styles = {
        OPEN: "bg-accent/20 text-accent border-accent/40",
        CLOSED: "bg-muted text-muted-foreground border-border",
        SUSPENDED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    };
    const icons = {
        OPEN: <Activity className="w-3 h-3" />,
        CLOSED: <XCircle className="w-3 h-3" />,
        SUSPENDED: <AlertCircle className="w-3 h-3" />,
    };
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles[status] || styles.CLOSED}`}
        >
            {icons[status]}
            {status}
        </span>
    );
}

function MetricCard({ icon: Icon, label, value, subtext, color = "primary", pulse = false }) {
    const colorMap = {
        primary: "from-primary/20 to-primary/5 border-primary/30 text-primary",
        accent: "from-accent/20 to-accent/5 border-accent/30 text-accent",
        blue: "from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-400",
        purple: "from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400",
    };
    return (
        <div className={`relative bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 overflow-hidden transition-all hover:scale-[1.02] duration-300`}>
            {pulse && (
                <span className="absolute top-3 right-3 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
                </span>
            )}
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-2xl font-black text-foreground tracking-tight">{value}</p>
                    {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color]} border`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}

function SessionCard({ session, onClose, onSuspend, onResume, closing }) {
    const elapsed = session.shiftStartTime
        ? formatElapsed(new Date(session.shiftStartTime))
        : "—";

    return (
        <div className="bg-card border border-primary/20 rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Monitor className="w-4 h-4 text-primary" />
                        <span className="font-bold text-foreground">{session.deviceId}</span>
                    </div>
                    {session.counterName && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {session.counterName}
                        </p>
                    )}
                </div>
                <StatusBadge status={session.status} />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center bg-card-elevated rounded-xl p-3">
                    <p className="text-lg font-black text-foreground">{session.totalTicketsSold ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tickets</p>
                </div>
                <div className="text-center bg-card-elevated rounded-xl p-3">
                    <p className="text-sm font-black text-foreground">
                        R {((session.totalCashCollected ?? 0) + (session.totalCardCollected ?? 0) + (session.totalOnlineCollected ?? 0)).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Revenue</p>
                </div>
                <div className="text-center bg-card-elevated rounded-xl p-3">
                    <p className="text-sm font-black text-foreground">{elapsed}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                </div>
            </div>

            <div className="flex gap-2">
                {session.status === "OPEN" && (
                    <>
                        <button
                            onClick={() => onSuspend(session._id)}
                            className="flex-1 py-2 text-xs font-bold rounded-xl border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-all"
                        >
                            Suspend
                        </button>
                        <button
                            onClick={() => onClose(session._id)}
                            disabled={closing === session._id}
                            className="flex-1 py-2 text-xs font-bold rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                        >
                            {closing === session._id ? "Closing…" : "Close Shift"}
                        </button>
                    </>
                )}
                {session.status === "SUSPENDED" && (
                    <button
                        onClick={() => onResume(session._id)}
                        className="flex-1 py-2 text-xs font-bold rounded-xl border border-accent/30 text-accent hover:bg-accent/10 transition-all"
                    >
                        Resume
                    </button>
                )}
                {session.status === "CLOSED" && (
                    <p className="flex-1 text-center py-2 text-xs text-muted-foreground">
                        Shift ended {session.shiftEndTime ? new Date(session.shiftEndTime).toLocaleTimeString() : "—"}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function formatElapsed(start) {
    const ms = Date.now() - start.getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatCurrency(val) {
    return `R ${(val ?? 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─────────────────────────────────────────────────────────────
// Open Session Modal
// ─────────────────────────────────────────────────────────────
function OpenSessionModal({ posStaffRecord, userId, token, onSuccess, onClose }) {
    const [deviceId, setDeviceId] = useState("");
    const [counterName, setCounterName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleOpen = async () => {
        if (!deviceId.trim()) { setError("Device ID is required"); return; }
        if (!posStaffRecord?._id) { setError("Your POS Staff record could not be found."); return; }
        setLoading(true);
        setError("");
        try {
            await apiFetch(`${API}/pos-session`, token, {
                method: "POST",
                body: JSON.stringify({
                    posStaffId: posStaffRecord._id,
                    userId,
                    venueId: posStaffRecord.venueId?._id ?? posStaffRecord.venueId,
                    deviceId: deviceId.trim(),
                    counterName: counterName.trim() || posStaffRecord.defaultCounterName || undefined,
                }),
            });
            onSuccess();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-card border border-primary/30 rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-primary/10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-primary/20 border border-primary/30">
                        <Monitor className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-foreground">Open New Session</h2>
                        <p className="text-xs text-muted-foreground">Start your shift at a terminal</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3 mb-4">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">
                            Device / Terminal ID *
                        </label>
                        <input
                            value={deviceId}
                            onChange={(e) => setDeviceId(e.target.value)}
                            placeholder="e.g. POS-TERM-01"
                            className="w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground p-4 text-sm focus:border-primary focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black text-primary uppercase tracking-widest mb-2">
                            Counter / Booth Name
                        </label>
                        <input
                            value={counterName}
                            onChange={(e) => setCounterName(e.target.value)}
                            placeholder={posStaffRecord?.defaultCounterName || "e.g. Box Office A"}
                            className="w-full rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground p-4 text-sm focus:border-primary focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border-2 border-primary/20 text-muted-foreground font-bold hover:bg-card-elevated transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleOpen}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-primary-foreground font-black uppercase tracking-wide hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? "Opening…" : "Open Shift"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Main POS Dashboard Page
// ─────────────────────────────────────────────────────────────
export default function POSPage() {
    const { user, token, logout } = useAuth();
    const router = useRouter();

    const [posStaff, setPosStaff] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [todaySummary, setTodaySummary] = useState(null);
    const [loadingData, setLoadingData] = useState(true);
    const [closingId, setClosingId] = useState(null);
    const [showOpenModal, setShowOpenModal] = useState(false);
    const [activeTab, setActiveTab] = useState("dashboard");
    const [searchQuery, setSearchQuery] = useState("");
    const [liveTime, setLiveTime] = useState(new Date());

    // Live clock
    useEffect(() => {
        const t = setInterval(() => setLiveTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    // ── Data Loading ──────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!token || !user?._id) return;
        setLoadingData(true);
        try {
            // 1. Lookup POS Staff record for this user
            const staffRecord = await apiFetch(
                `${API}/pos/user/${user._id}`,
                token
            ).catch(() => null);
            setPosStaff(staffRecord);

            // 2. Fetch all sessions this user has had
            const userSessions = await apiFetch(
                `${API}/pos-session/user/${user._id}`,
                token
            ).catch(() => []);
            setSessions(Array.isArray(userSessions) ? userSessions : []);

            // 3. If staff belongs to a venue, fetch today's summary
            const venueId = staffRecord?.venueId?._id ?? staffRecord?.venueId;
            if (venueId) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                const summary = await apiFetch(
                    `${API}/pos-session/venue/${venueId}/summary?from=${today.toISOString()}&to=${tomorrow.toISOString()}`,
                    token
                ).catch(() => null);
                setTodaySummary(summary);
            }
        } catch (err) {
            console.error("POS data load error:", err);
        } finally {
            setLoadingData(false);
        }
    }, [token, user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Session lifecycle actions ─────────────────────────────
    const handleCloseSession = async (sessionId) => {
        setClosingId(sessionId);
        try {
            await apiFetch(`${API}/pos-session/${sessionId}/close`, token, {
                method: "PATCH",
                body: JSON.stringify({ shiftEndTime: new Date().toISOString(), closedBy: user._id }),
            });
            await loadData();
        } catch (e) {
            alert(`Could not close session: ${e.message}`);
        } finally {
            setClosingId(null);
        }
    };

    const handleSuspend = async (sessionId) => {
        try {
            await apiFetch(`${API}/pos-session/${sessionId}/suspend`, token, { method: "PATCH" });
            await loadData();
        } catch (e) {
            alert(`Could not suspend session: ${e.message}`);
        }
    };

    const handleResume = async (sessionId) => {
        try {
            await apiFetch(`${API}/pos-session/${sessionId}/resume`, token, { method: "PATCH" });
            await loadData();
        } catch (e) {
            alert(`Could not resume session: ${e.message}`);
        }
    };

    // ── Derived state ─────────────────────────────────────────
    const openSession = sessions.find((s) => s.status === "OPEN");
    const recentSessions = sessions.slice(0, 10);
    const filteredSessions = searchQuery
        ? sessions.filter(
            (s) =>
                s.deviceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.counterName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.status?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : recentSessions;

    const tabItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "sessions", label: "Sessions", icon: Clock },
        { id: "stats", label: "Today's Stats", icon: BarChart3 },
    ];

    // ─────────────────────────────────────────────────────────
    return (
        <RoleGuard allowedRoles={["TICKETING"]}>
            <div className="min-h-screen bg-background">
                <Navbar />

                {/* ── Header Banner ── */}
                <div className="relative bg-gradient-to-r from-card via-card-elevated to-card border-b border-primary/20 overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-2xl" />
                    </div>
                    <div className="relative max-w-7xl mx-auto px-6 py-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            {/* Left — Identity */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/30">
                                        <span className="text-xl font-black text-primary-foreground">
                                            {(user?.name?.[0] || "P").toUpperCase()}
                                        </span>
                                    </div>
                                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${openSession ? "bg-accent" : "bg-muted-foreground"}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">POS Terminal</p>
                                    <h1 className="text-xl font-black text-foreground">{user?.name || "Ticketing Staff"}</h1>
                                    <p className="text-xs text-primary font-bold">
                                        {posStaff?.venueId?.name ?? "—"}{posStaff?.defaultCounterName ? ` · ${posStaff.defaultCounterName}` : ""}
                                    </p>
                                </div>
                            </div>

                            {/* Center — Live Clock */}
                            <div className="hidden md:flex flex-col items-center">
                                <p className="text-3xl font-black text-foreground font-mono tracking-widest">
                                    {liveTime.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {liveTime.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                </p>
                            </div>

                            {/* Right — Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={loadData}
                                    className="p-2.5 rounded-xl border border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                                    title="Refresh"
                                >
                                    <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
                                </button>
                                {!openSession && (
                                    <button
                                        onClick={() => setShowOpenModal(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-primary-foreground font-black text-sm uppercase tracking-wide hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Open Shift
                                    </button>
                                )}
                                {openSession && (
                                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-accent text-sm font-bold">
                                        <Activity className="w-4 h-4 animate-pulse" />
                                        Shift Active
                                    </div>
                                )}
                                <button
                                    onClick={() => { logout(); router.push("/auth/login"); }}
                                    className="p-2.5 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 transition-all"
                                    title="Sign out"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Active Session Ribbon ── */}
                {openSession && (
                    <div className="bg-gradient-to-r from-accent/10 via-accent/5 to-accent/10 border-b border-accent/20 px-6 py-3">
                        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-accent" />
                                <span className="text-sm font-bold text-foreground">
                                    Session running on <span className="text-accent">{openSession.deviceId}</span>
                                </span>
                                {openSession.counterName && (
                                    <span className="text-xs text-muted-foreground">· {openSession.counterName}</span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    · Started {new Date(openSession.shiftStartTime).toLocaleTimeString()}
                                    {" "}({formatElapsed(new Date(openSession.shiftStartTime))})
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSuspend(openSession._id)}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition-all"
                                >
                                    Suspend
                                </button>
                                <button
                                    onClick={() => handleCloseSession(openSession._id)}
                                    disabled={closingId === openSession._id}
                                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                                >
                                    {closingId === openSession._id ? "Closing…" : "End Shift"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Main Content ── */}
                <main className="max-w-7xl mx-auto px-6 py-8 pb-24 md:pb-8">

                    {/* Tab Bar */}
                    <div className="flex gap-1 bg-card-elevated border border-primary/10 rounded-2xl p-1.5 mb-8 w-fit">
                        {tabItems.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === id
                                        ? "bg-gradient-to-r from-primary to-primary-dark text-primary-foreground shadow-md shadow-primary/20"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Loading skeleton ── */}
                    {loadingData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-28 rounded-2xl bg-card animate-pulse border border-primary/10" />
                            ))}
                        </div>
                    )}

                    {/* ─── TAB: DASHBOARD ─── */}
                    {!loadingData && activeTab === "dashboard" && (
                        <div className="space-y-8">
                            {/* Metric Cards */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <MetricCard
                                    icon={Ticket}
                                    label="Tickets Sold Today"
                                    value={todaySummary?.totalTicketsSold ?? 0}
                                    subtext="Current shift"
                                    color="primary"
                                    pulse={!!openSession}
                                />
                                <MetricCard
                                    icon={Banknote}
                                    label="Cash Collected"
                                    value={formatCurrency(todaySummary?.totalCashCollected)}
                                    color="accent"
                                />
                                <MetricCard
                                    icon={CreditCard}
                                    label="Card Collected"
                                    value={formatCurrency(todaySummary?.totalCardCollected)}
                                    color="blue"
                                />
                                <MetricCard
                                    icon={TrendingUp}
                                    label="Total Revenue"
                                    value={formatCurrency(todaySummary?.totalRevenue)}
                                    subtext={`${todaySummary?.totalSessions ?? 0} sessions today`}
                                    color="purple"
                                />
                            </div>

                            {/* Quick-action cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => router.push("/pos/sell")}
                                    className="group flex items-center justify-between p-5 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-2xl hover:border-primary/60 hover:scale-[1.01] transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-primary/20 border border-primary/30">
                                            <Ticket className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-foreground">Sell Ticket</p>
                                            <p className="text-xs text-muted-foreground">Process a walk-in sale</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </button>

                                <button
                                    onClick={() => setActiveTab("sessions")}
                                    className="group flex items-center justify-between p-5 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-2xl hover:border-blue-500/40 hover:scale-[1.01] transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-500/30">
                                            <Clock className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-foreground">View Sessions</p>
                                            <p className="text-xs text-muted-foreground">Manage your shifts</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-400 transition-colors" />
                                </button>

                                <button
                                    onClick={() => setActiveTab("stats")}
                                    className="group flex items-center justify-between p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-2xl hover:border-purple-500/40 hover:scale-[1.01] transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                                            <BarChart3 className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-foreground">Today's Stats</p>
                                            <p className="text-xs text-muted-foreground">Sales & revenue report</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-400 transition-colors" />
                                </button>
                            </div>

                            {/* Current session spotlight */}
                            {openSession && (
                                <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 rounded-2xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="w-4 h-4 text-accent animate-pulse" />
                                        <h2 className="font-black text-foreground">Active Session</h2>
                                    </div>
                                    <SessionCard
                                        session={openSession}
                                        onClose={handleCloseSession}
                                        onSuspend={handleSuspend}
                                        onResume={handleResume}
                                        closing={closingId}
                                    />
                                </div>
                            )}

                            {/* No staff record warning */}
                            {!posStaff && (
                                <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 text-center">
                                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
                                    <h3 className="font-black text-foreground mb-1">POS Profile Missing</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your account doesn't have a POS Staff profile yet. Please ask an administrator to create one.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── TAB: SESSIONS ─── */}
                    {!loadingData && activeTab === "sessions" && (
                        <div className="space-y-6">
                            {/* Search + Open Shift */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by device, counter or status…"
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground text-sm focus:border-primary focus:outline-none"
                                    />
                                </div>
                                {!openSession && posStaff && (
                                    <button
                                        onClick={() => setShowOpenModal(true)}
                                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-primary-foreground font-black text-sm uppercase tracking-wide hover:opacity-90 transition-all shadow-lg shadow-primary/20 whitespace-nowrap"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        Open Shift
                                    </button>
                                )}
                            </div>

                            {/* Session grid */}
                            {filteredSessions.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p className="font-bold">No sessions found</p>
                                    <p className="text-sm mt-1">Start your first shift to see it here</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredSessions.map((session) => (
                                        <SessionCard
                                            key={session._id}
                                            session={session}
                                            onClose={handleCloseSession}
                                            onSuspend={handleSuspend}
                                            onResume={handleResume}
                                            closing={closingId}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── TAB: STATS ─── */}
                    {!loadingData && activeTab === "stats" && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                <h2 className="text-lg font-black text-foreground">Today's Revenue Breakdown</h2>
                                <span className="text-xs text-muted-foreground">
                                    {new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
                                </span>
                            </div>

                            {!todaySummary ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                    <p className="font-bold">No data available yet</p>
                                    <p className="text-sm mt-1">Start a session and sell tickets to see stats</p>
                                </div>
                            ) : (
                                <>
                                    {/* Revenue breakdown */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {[
                                            { label: "Cash", value: todaySummary.totalCashCollected, icon: Banknote, color: "accent" },
                                            { label: "Card", value: todaySummary.totalCardCollected, icon: CreditCard, color: "blue" },
                                            { label: "Online / EFT", value: todaySummary.totalOnlineCollected, icon: Smartphone, color: "purple" },
                                        ].map(({ label, value, icon: Icon, color }) => (
                                            <MetricCard key={label} icon={Icon} label={label} value={formatCurrency(value)} color={color} />
                                        ))}
                                    </div>

                                    {/* Summary totals */}
                                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="text-center">
                                                <p className="text-3xl font-black text-primary">{todaySummary.totalTicketsSold ?? 0}</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Tickets Sold</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-3xl font-black text-foreground">{todaySummary.totalSessions ?? 0}</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Sessions Run</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-foreground">{formatCurrency(todaySummary.totalRevenue)}</p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Total Revenue</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-2xl font-black text-foreground">
                                                    {todaySummary.totalTicketsSold > 0
                                                        ? formatCurrency(todaySummary.totalRevenue / todaySummary.totalTicketsSold)
                                                        : "—"}
                                                </p>
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Avg per Ticket</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bars */}
                                    <div className="bg-card border border-primary/20 rounded-2xl p-6">
                                        <h3 className="font-black text-foreground mb-5">Payment Method Split</h3>
                                        <div className="space-y-4">
                                            {[
                                                { label: "Cash", value: todaySummary.totalCashCollected, color: "bg-accent" },
                                                { label: "Card", value: todaySummary.totalCardCollected, color: "bg-blue-400" },
                                                { label: "Online", value: todaySummary.totalOnlineCollected, color: "bg-purple-400" },
                                            ].map(({ label, value, color }) => {
                                                const pct = todaySummary.totalRevenue > 0
                                                    ? Math.round((value / todaySummary.totalRevenue) * 100)
                                                    : 0;
                                                return (
                                                    <div key={label}>
                                                        <div className="flex justify-between text-sm font-bold mb-1.5">
                                                            <span className="text-muted-foreground">{label}</span>
                                                            <span className="text-foreground">{formatCurrency(value)} ({pct}%)</span>
                                                        </div>
                                                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${color} rounded-full transition-all duration-1000`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </main>

                {/* ── Open Session Modal ── */}
                {showOpenModal && (
                    <OpenSessionModal
                        posStaffRecord={posStaff}
                        userId={user?._id}
                        token={token}
                        onSuccess={() => { setShowOpenModal(false); loadData(); }}
                        onClose={() => setShowOpenModal(false)}
                    />
                )}
            </div>
        </RoleGuard>
    );
}
