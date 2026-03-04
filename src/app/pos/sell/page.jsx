"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import RoleGuard from "@/app/components/RoleGuard";
import Navbar from "@/app/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useVenueEvents, useEventDetails, getSafeId } from "@/hooks/useCustomer";
import { formatDate, formatTime } from "@/app/utils/dateUtils";
import {
    Ticket,
    ArrowLeft,
    Search,
    MapPin,
    Calendar,
    Clock,
    Users,
    Banknote,
    CreditCard,
    Smartphone,
    ChevronRight,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    X,
    Sparkles,
    Music,
    Crown,
    Star,
    ShoppingCart,
    Zap,
    Info,
    Package,
    Filter,
    Tag,
    Printer,
    User,
    Mail,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URI || "http://localhost:5000";

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

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatCurrency(val) {
    return `R ${(val ?? 0).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Parse a virtual seat ID ("eventId:sectionId:row:seatNumber") into a readable label.
 * Falls back gracefully for plain Mongo ObjectId strings.
 */
function parseSeatLabel(id) {
    if (!id) return "—";
    if (id.includes(":")) {
        const parts = id.split(":");
        // virtual format: eventId:sectionId:row:seatNum  (4 parts)
        if (parts.length >= 4) {
            const row = parts[parts.length - 2];
            const seat = parts[parts.length - 1];
            return `Row ${row} · Seat ${seat}`;
        }
    }
    // Mongo ObjectId fallback — show last 6 chars
    return `#${id.slice(-6).toUpperCase()}`;
}

function getStatusColor(status) {
    const map = {
        ACTIVE: "bg-accent/20 text-accent border-accent/40",
        PUBLISHED: "bg-accent/20 text-accent border-accent/40",
        SOLD_OUT: "bg-red-500/20 text-red-400 border-red-500/40",
        DRAFT: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
        CANCELLED: "bg-muted text-muted-foreground border-border",
        COMPLETED: "bg-muted text-muted-foreground border-border",
    };
    return map[status] || "bg-muted text-muted-foreground border-border";
}

// ─── Step indicator ─────────────────────────────────────────────────────────
function StepBadge({ step, current, label }) {
    const done = current > step;
    const active = current === step;
    return (
        <div className="flex items-center gap-2">
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${done
                    ? "bg-accent border-accent text-background"
                    : active
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-card-elevated border-border text-muted-foreground"
                    }`}
            >
                {done ? <CheckCircle2 className="w-4 h-4" /> : step}
            </div>
            <span
                className={`text-sm font-bold hidden sm:block ${active ? "text-foreground" : done ? "text-accent" : "text-muted-foreground"
                    }`}
            >
                {label}
            </span>
        </div>
    );
}

function StepDivider({ done }) {
    return (
        <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${done ? "bg-accent" : "bg-border"}`} />
    );
}

// ─── Event Card ──────────────────────────────────────────────────────────────
function EventCard({ event, onSelect }) {
    const venue = event.venueId;
    const isOver = event.endDateTime && new Date(event.endDateTime) < new Date();
    const isSoldOut = event.status === "SOLD_OUT";
    const isUnavailable = isOver || isSoldOut || event.status === "CANCELLED" || event.status === "COMPLETED";

    const image = event.images?.landscapeImage || event.images?.portraitImage
        || event.landscapeImage || event.portraitImage;

    return (
        <div
            onClick={() => !isUnavailable && onSelect(event)}
            className={`group relative bg-gradient-to-br from-card to-card-elevated border-2 rounded-2xl overflow-hidden transition-all duration-300
                ${isUnavailable
                    ? "border-border opacity-60 cursor-not-allowed"
                    : "border-primary/20 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 cursor-pointer hover:scale-[1.01]"
                }`}
        >
            {/* Image */}
            <div className="relative h-40 overflow-hidden bg-card-elevated">
                {image ? (
                    <img
                        src={image}
                        alt={event.name}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                        onError={(e) => { e.target.style.display = "none"; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Ticket className="w-12 h-12 text-primary/30" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />

                {/* Status badge */}
                <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${getStatusColor(event.status)}`}>
                        {event.status === "PUBLISHED" || event.status === "ACTIVE" ? (
                            <><Sparkles className="w-3 h-3" /> Live</>
                        ) : event.status === "SOLD_OUT" ? (
                            <><Package className="w-3 h-3" /> Sold Out</>
                        ) : isOver ? (
                            <><Clock className="w-3 h-3" /> Ended</>
                        ) : (
                            event.status
                        )}
                    </span>
                </div>

                {/* Category badge */}
                {event.category && (
                    <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-bold">
                            {event.category}
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                <h3 className="font-black text-foreground text-base leading-tight mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {event.name}
                </h3>

                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="font-medium">{formatDate(event.startDateTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="font-medium">{formatTime(event.startDateTime)}</span>
                    </div>
                    {venue && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span className="font-medium truncate">{typeof venue === "object" ? venue.name : venue}</span>
                        </div>
                    )}
                </div>

                {/* Zones/Pricing */}
                {event.zones && event.zones.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {event.zones.slice(0, 3).map((z, i) => (
                            <span key={i} className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                                {z.name} · R{z.price?.toLocaleString()}
                            </span>
                        ))}
                        {event.zones.length > 3 && (
                            <span className="px-2 py-1 rounded-lg bg-card-elevated border border-border text-muted-foreground text-xs font-bold">
                                +{event.zones.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {/* CTA */}
                {!isUnavailable && (
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">
                            Tap to select
                        </span>
                        <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </div>
                )}
                {isUnavailable && (
                    <p className="text-xs text-muted-foreground font-medium">
                        {isOver ? "This event has ended" : isSoldOut ? "No tickets available" : "Unavailable"}
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Zone / Seat Selector ───────────────────────────────────────────────────
function ZoneSelector({ zones, selectedZone, onSelect }) {
    return (
        <div className="space-y-3">
            <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">Select Zone</p>
            {zones.map((zone, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(zone)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${selectedZone?.name === zone.name
                        ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                        : "border-primary/20 bg-card-elevated hover:border-primary/50 hover:bg-primary/5"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${selectedZone?.name === zone.name ? "bg-primary border-primary" : "bg-card border-border"}`}>
                            {selectedZone?.name === zone.name
                                ? <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                                : <Tag className="w-4 h-4 text-muted-foreground" />
                            }
                        </div>
                        <span className="font-black text-foreground uppercase tracking-wide text-sm">{zone.name}</span>
                    </div>
                    <span className="text-primary font-black text-lg">R{zone.price?.toLocaleString()}</span>
                </button>
            ))}
        </div>
    );
}

// ─── Payment Method Selector ─────────────────────────────────────────────────
function PaymentSelector({ selected, onChange }) {
    const methods = [
        { id: "CASH", label: "Cash", icon: Banknote, color: "accent" },
        { id: "CARD", label: "Card", icon: CreditCard, color: "blue" },
        { id: "ONLINE", label: "Online / EFT", icon: Smartphone, color: "purple" },
    ];
    const colorMap = {
        accent: "border-accent bg-accent/10 text-accent",
        blue: "border-blue-400 bg-blue-400/10 text-blue-400",
        purple: "border-purple-400 bg-purple-400/10 text-purple-400",
    };

    return (
        <div>
            <p className="text-xs font-black text-primary uppercase tracking-widest mb-3">Payment Method</p>
            <div className="grid grid-cols-3 gap-3">
                {methods.map(({ id, label, icon: Icon, color }) => (
                    <button
                        key={id}
                        onClick={() => onChange(id)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${selected === id
                            ? colorMap[color]
                            : "border-primary/20 bg-card-elevated text-muted-foreground hover:border-primary/40"
                            }`}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-black">{label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Confirmation Receipt ────────────────────────────────────────────────────
function SaleReceipt({ saleData, onDone }) {
    const receiptRef = typeof window !== "undefined" ? null : null;

    const handlePrint = () => {
        const printTime = new Date().toLocaleString("en-ZA");
        const seatLabels = (saleData.seatIds ?? []).map(parseSeatLabel).join(", ") || "—";
        const rows = [
            ["Event", saleData.eventName],
            ["Zone", saleData.zoneName],
            ["Seats", `${saleData.qty} ticket(s)`],
            ["Booked", seatLabels],
            ["Payment", saleData.paymentMethod],
            ["Total", `R ${(saleData.total ?? 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`],
            ["Order ID", `#${saleData.orderId?.slice(-8)?.toUpperCase() || "—"}`],
            ["Printed", printTime],
        ];

        const tableRows = rows
            .map(([label, value]) =>
                `<tr>
                    <td style="padding:6px 4px;font-size:11px;color:#555;text-transform:uppercase;letter-spacing:.05em;font-weight:700;border-bottom:1px solid #eee;white-space:nowrap">${label}</td>
                    <td style="padding:6px 4px;font-size:12px;font-weight:800;text-align:right;border-bottom:1px solid #eee">${value}</td>
                </tr>`
            )
            .join("");

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>POS Receipt – ${saleData.orderId?.slice(-8)?.toUpperCase()}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', Courier, monospace; background: #fff; color: #111; width: 80mm; margin: 0 auto; padding: 8px; }
    .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 10px; margin-bottom: 10px; }
    .header h1 { font-size: 16px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase; }
    .header p  { font-size: 11px; color: #555; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    .total-row td { font-size: 15px !important; font-weight: 900 !important; border-bottom: none !important; padding-top: 10px !important; color: #000; }
    .footer { text-align: center; margin-top: 14px; border-top: 2px dashed #ccc; padding-top: 10px; }
    .footer p  { font-size: 10px; color: #888; }
    @media print { @page { margin: 4mm; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎟 POS Receipt</h1>
    <p>Providence Entertainment &amp; Ticketing</p>
  </div>
  <table>
    ${tableRows}
  </table>
  <div class="footer">
    <p>Thank you for your purchase!</p>
    <p>Please keep this receipt as proof of purchase.</p>
  </div>
</body>
</html>`;

        const win = window.open("", "_blank", "width=400,height=600");
        if (!win) { alert("Please allow popups to print the receipt."); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
        // Small delay so browser renders before printing
        setTimeout(() => { win.print(); win.close(); }, 300);
    };

    return (
        <div className="flex flex-col items-center py-8">
            {/* Success icon */}
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-full bg-accent/20 border-4 border-accent flex items-center justify-center shadow-xl shadow-accent/30">
                    <CheckCircle2 className="w-12 h-12 text-accent" />
                </div>
                <div className="absolute -top-1 -right-1">
                    <span className="flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-accent" />
                    </span>
                </div>
            </div>

            <h2 className="text-2xl font-black text-foreground mb-1">Sale Complete!</h2>
            <p className="text-muted-foreground text-sm mb-8">Ticket issued successfully</p>

            {/* Receipt card */}
            <div className="w-full max-w-sm bg-gradient-to-br from-card to-card-elevated border-2 border-primary/20 rounded-2xl overflow-hidden shadow-xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-dark p-4 text-center">
                    <Ticket className="w-6 h-6 text-primary-foreground mx-auto mb-1" />
                    <p className="text-primary-foreground font-black text-sm uppercase tracking-widest">Receipt</p>
                </div>

                {/* Perforated edge */}
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-background -ml-2 border-r border-border" />
                    <div className="flex-1 border-t-2 border-dashed border-primary/20" />
                    <div className="w-4 h-4 rounded-full bg-background -mr-2 border-l border-border" />
                </div>

                {/* Details */}
                <div className="px-6 py-4 space-y-3">
                    {[
                        { label: "Event", value: saleData.eventName },
                        { label: "Zone", value: saleData.zoneName },
                        { label: "Seats", value: `${saleData.qty} ticket(s)` },
                        { label: "Payment", value: saleData.paymentMethod },
                        { label: "Total", value: formatCurrency(saleData.total), highlight: true },
                        { label: "Order ID", value: `#${saleData.orderId?.slice(-8)?.toUpperCase() || "—"}` },
                    ].map(({ label, value, highlight }) => (
                        <div key={label} className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{label}</span>
                            <span className={`text-sm font-black ${highlight ? "text-accent" : "text-foreground"}`}>{value}</span>
                        </div>
                    ))}

                    {/* Booked seat labels */}
                    {saleData.seatIds && saleData.seatIds.length > 0 && (
                        <div className="pt-2">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Booked Seats</p>
                            <div className="flex flex-wrap gap-1.5">
                                {saleData.seatIds.map((id) => (
                                    <span
                                        key={id}
                                        className="px-2 py-1 rounded-md bg-primary/10 border border-primary/25 text-primary text-xs font-black"
                                    >
                                        {parseSeatLabel(id)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Perforated edge */}
                <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-background -ml-2 border-r border-border" />
                    <div className="flex-1 border-t-2 border-dashed border-primary/20" />
                    <div className="w-4 h-4 rounded-full bg-background -mr-2 border-l border-border" />
                </div>

                <div className="px-6 py-4 text-center">
                    <p className="text-xs text-muted-foreground font-medium">
                        {new Date().toLocaleString("en-ZA")}
                    </p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-8 w-full max-w-sm">
                <button
                    onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-primary/30 text-primary font-black uppercase tracking-wide hover:bg-primary/10 transition-all"
                >
                    <Printer className="w-4 h-4" />
                    Print
                </button>
                <button
                    onClick={onDone}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-primary-foreground font-black uppercase tracking-wide hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    Sell Another
                </button>
            </div>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function POSSellPage() {
    const router = useRouter();
    const { user, token } = useAuth();

    // Step: 1 = pick event, 2 = configure ticket, 3 = confirm, 4 = done
    const [step, setStep] = useState(1);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("ALL");

    // POS staff record (to get venueId)
    const [posStaff, setPosStaff] = useState(null);
    const [staffLoading, setStaffLoading] = useState(true);

    // Ticket config
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedZone, setSelectedZone] = useState(null);
    const [selectedSeatIds, setSelectedSeatIds] = useState([]);
    const [qty, setQty] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Customer details (collected on Step 2)
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");

    // Sale result
    const [saleResult, setSaleResult] = useState(null);

    // Read URL params (returned from seating page)
    const searchParams = useSearchParams();

    // Load POS staff record to get venueId
    const loadStaff = useCallback(async () => {
        if (!token || !user?._id) return;
        setStaffLoading(true);
        try {
            const record = await apiFetch(`${API}/pos/user/${user._id}`, token).catch(() => null);
            setPosStaff(record);
        } finally {
            setStaffLoading(false);
        }
    }, [token, user]);

    useEffect(() => { loadStaff(); }, [loadStaff]);

    const venueId = posStaff?.venueId?._id ?? posStaff?.venueId ?? null;

    // Fetch events for this venue only
    const { data: venueEvents = [], isLoading: eventsLoading, error: eventsError, refetch } = useVenueEvents(venueId);

    // Categories from fetched events
    const categories = useMemo(() => {
        const cats = ["ALL", ...new Set(venueEvents.map(e => e.category).filter(Boolean))];
        return cats;
    }, [venueEvents]);

    // Filtered + searched events
    const displayedEvents = useMemo(() => {
        return venueEvents.filter(e => {
            const matchCat = categoryFilter === "ALL" || e.category === categoryFilter;
            const matchSearch = !search || e.name?.toLowerCase().includes(search.toLowerCase());
            return matchCat && matchSearch;
        });
    }, [venueEvents, search, categoryFilter]);

    // Handle return from seating page: pre-populate event + seats and jump to step 2
    useEffect(() => {
        if (!searchParams || venueEvents.length === 0 || step !== 1) return;
        const paramEventId = searchParams.get("eventId");
        const paramSeatIds = searchParams.get("seatIds");
        if (!paramEventId || !paramSeatIds) return;

        const foundEvent = venueEvents.find(e => e._id === paramEventId);
        if (!foundEvent) return;

        const ids = paramSeatIds.split(",").filter(Boolean);
        setSelectedEvent(foundEvent);
        setSelectedSeatIds(ids);
        setQty(ids.length || 1);
        setError("");
        setStep(2);
    }, [searchParams, venueEvents]);

    // Derive price from the event's first zone automatically (no manual zone picker)
    const eventZone = selectedEvent?.zones?.[0] ?? null;
    const pricePerSeat = eventZone?.price ?? 0;
    const totalAmount = pricePerSeat * qty;

    const handleEventSelect = (event) => {
        // Navigate to the seating screen so POS staff can select specific seats
        router.push(`/events/${event._id}/seating`);
    };

    const handleConfirm = () => {
        if (selectedSeatIds.length === 0) { setError("No seats selected. Please go back and choose seats on the seating map."); return; }
        setError("");
        setStep(3);
    };

    const handleSell = async () => {
        if (!selectedEvent) return;
        setSubmitting(true);
        setError("");
        try {
            // Find the active session for the staff
            const sessions = await apiFetch(`${API}/pos-session/user/${user._id}`, token).catch(() => []);
            const openSession = Array.isArray(sessions) ? sessions.find(s => s.status === "OPEN") : null;

            // Build the POS sale payload
            const payload = {
                eventId: selectedEvent._id,
                zoneName: eventZone?.name ?? "General",
                zonePrice: pricePerSeat,
                quantity: qty,
                paymentMethod,
                posStaffId: posStaff?._id,
                posSessionId: openSession?._id,
                venueId,
                userId: user._id,
                totalAmount,
                seatIds: selectedSeatIds.length > 0 ? selectedSeatIds : undefined,
                customerName: customerName.trim(),
                customerEmail: customerEmail.trim().toLowerCase(),
            };

            const result = await apiFetch(`${API}/pos-session/sell`, token, {
                method: "POST",
                body: JSON.stringify(payload),
            });

            // Success — jump straight to receipt (step 3)
            setSaleResult({
                eventName: selectedEvent.name,
                zoneName: eventZone?.name ?? "General",
                qty,
                paymentMethod,
                total: totalAmount,
                orderId: result?.orderId || result?._id || "UNKNOWN",
                seatIds: selectedSeatIds,
            });
            setStep(3);
        } catch (e) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetSale = () => {
        setStep(1);
        setSelectedEvent(null);
        setSelectedSeatIds([]);
        setQty(1);
        setPaymentMethod("CASH");
        setError("");
        setSaleResult(null);
        setCustomerName("");
        setCustomerEmail("");
    };

    const loading = staffLoading || eventsLoading;

    return (
        <RoleGuard allowedRoles={["TICKETING"]}>
            <div className="min-h-screen bg-background">
                <Navbar />

                {/* ── Page Header ── */}
                <div className="relative bg-gradient-to-r from-card via-card-elevated to-card border-b border-primary/20 overflow-hidden">
                    <div className="absolute inset-0">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                    </div>
                    <div className="relative max-w-7xl mx-auto px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => step > 1 ? setStep(step - 1) : router.push("/pos")}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    {step === 1 ? "POS Home" : "Back"}
                                </button>
                                <div className="w-px h-6 bg-border" />
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">POS Terminal</p>
                                    <h1 className="text-lg font-black text-foreground">Sell Ticket</h1>
                                </div>
                            </div>

                            {/* Venue badge */}
                            {posStaff?.venueId && (
                                <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-xl">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-bold text-foreground">
                                        {typeof posStaff.venueId === "object" ? posStaff.venueId.name : "Your Venue"}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* ── Stepper ── */}
                        <div className="flex items-center mt-5 max-w-sm">
                            <StepBadge step={1} current={step} label="Pick Event" />
                            <StepDivider done={step > 1} />
                            <StepBadge step={2} current={step} label="Select & Pay" />
                            <StepDivider done={step > 2} />
                            <StepBadge step={3} current={step} label="Receipt" />
                        </div>
                    </div>
                </div>

                {/* ── Main Content ── */}
                <main className="max-w-7xl mx-auto px-6 py-8 pb-24">

                    {/* ── STEP 1: Pick Event ── */}
                    {step === 1 && (
                        <div>
                            {/* No POS profile warning */}
                            {!staffLoading && !posStaff && (
                                <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 text-center mb-6">
                                    <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
                                    <h3 className="font-black text-foreground mb-1">No POS Profile Found</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your account doesn't have a POS Staff profile or venue assignment yet. Please contact an administrator.
                                    </p>
                                </div>
                            )}

                            {/* No venue assigned */}
                            {!staffLoading && posStaff && !venueId && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center mb-6">
                                    <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                                    <h3 className="font-black text-foreground mb-1">No Venue Assigned</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your POS profile doesn't have a venue assigned. Please ask an administrator to set your venue.
                                    </p>
                                </div>
                            )}

                            {/* Search + Filter bar */}
                            {!staffLoading && venueId && (
                                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            placeholder="Search events…"
                                            className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground text-sm focus:border-primary focus:outline-none"
                                        />
                                        {search && (
                                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Category filter */}
                                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setCategoryFilter(cat)}
                                                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border-2 transition-all ${categoryFilter === cat
                                                    ? "bg-gradient-to-r from-primary to-primary-dark text-primary-foreground border-primary"
                                                    : "border-primary/20 bg-card-elevated text-muted-foreground hover:border-primary/40"
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => refetch()}
                                        className="p-3 rounded-xl border border-primary/20 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all"
                                        title="Refresh"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${eventsLoading ? "animate-spin" : ""}`} />
                                    </button>
                                </div>
                            )}

                            {/* Venue info banner */}
                            {!staffLoading && venueId && (
                                <div className="flex items-center gap-3 mb-5 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                                    <p className="text-sm text-foreground font-bold">
                                        Showing events at{" "}
                                        <span className="text-primary">
                                            {typeof posStaff?.venueId === "object" ? posStaff.venueId.name : "your venue"}
                                        </span>
                                    </p>
                                    <span className="ml-auto text-xs text-muted-foreground font-medium">
                                        {displayedEvents.length} event{displayedEvents.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            )}

                            {/* Loading skeleton */}
                            {loading && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="h-72 rounded-2xl bg-card animate-pulse border border-primary/10" />
                                    ))}
                                </div>
                            )}

                            {/* Events grid */}
                            {!loading && venueId && (
                                <>
                                    {displayedEvents.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-center">
                                            <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 mb-4">
                                                <Ticket className="w-10 h-10 text-primary" />
                                            </div>
                                            <h3 className="font-black text-foreground text-lg mb-2">No Events Found</h3>
                                            <p className="text-muted-foreground text-sm max-w-xs">
                                                {search ? `No events match "${search}"` : "There are no upcoming events at your venue right now."}
                                            </p>
                                            {search && (
                                                <button
                                                    onClick={() => setSearch("")}
                                                    className="mt-4 px-4 py-2 rounded-xl border border-primary/30 text-primary text-sm font-bold hover:bg-primary/10 transition-all"
                                                >
                                                    Clear Search
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {displayedEvents.map((event) => (
                                                <EventCard key={event._id} event={event} onSelect={handleEventSelect} />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* ── STEP 2: Configure Ticket ── */}
                    {step === 2 && selectedEvent && (
                        <div className="max-w-2xl mx-auto">
                            {/* Selected event summary */}
                            <div className="bg-gradient-to-br from-card to-card-elevated border-2 border-primary/20 rounded-2xl p-6 mb-6">
                                <div className="flex items-start gap-4">
                                    {(selectedEvent.images?.landscapeImage || selectedEvent.images?.portraitImage
                                        || selectedEvent.landscapeImage || selectedEvent.portraitImage) && (
                                            <img
                                                src={selectedEvent.images?.landscapeImage || selectedEvent.images?.portraitImage
                                                    || selectedEvent.landscapeImage || selectedEvent.portraitImage}
                                                alt={selectedEvent.name}
                                                className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-primary/20"
                                                onError={(e) => { e.target.style.display = "none"; }}
                                            />
                                        )}
                                    <div className="flex-1 min-w-0">
                                        <h2 className="font-black text-foreground text-lg leading-tight mb-1">{selectedEvent.name}</h2>
                                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(selectedEvent.startDateTime)}</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(selectedEvent.startDateTime)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStep(1)}
                                        className="p-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Selected seats summary */}
                                <div className="bg-card border-2 border-primary/20 rounded-2xl p-6">
                                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">Selected Seats</p>
                                    {selectedSeatIds.length > 0 ? (
                                        <>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {selectedSeatIds.map((id) => (
                                                    <span key={id} className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-black">
                                                        {parseSeatLabel(id)}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {selectedSeatIds.length} seat{selectedSeatIds.length !== 1 ? "s" : ""} selected
                                            </p>
                                        </>
                                    ) : (
                                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400 font-bold flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            No seats selected. Please go back and select seats on the seating map.
                                        </div>
                                    )}
                                    <button
                                        onClick={() => router.push(`/events/${selectedEvent._id}/seating`)}
                                        className="mt-4 flex items-center gap-2 text-sm text-primary font-bold hover:underline"
                                    >
                                        <MapPin className="w-4 h-4" /> Change Seat Selection
                                    </button>
                                </div>

                                {/* Customer Details — required before processing */}
                                <div className="bg-card border-2 border-primary/20 rounded-2xl p-6">
                                    <p className="text-xs font-black text-primary uppercase tracking-widest mb-4">Customer Details</p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                                <User className="w-3.5 h-3.5" /> Customer Name <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="e.g. Jane Doe"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground text-sm focus:border-primary focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" /> Customer Email <span className="text-red-400">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={customerEmail}
                                                onChange={(e) => setCustomerEmail(e.target.value)}
                                                placeholder="e.g. jane@example.com"
                                                className="w-full px-4 py-3 rounded-xl border-2 border-primary/20 bg-card-elevated text-foreground placeholder-muted-foreground text-sm focus:border-primary focus:outline-none transition-colors"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            A customer account will be created or linked using this email.
                                        </p>
                                    </div>
                                </div>

                                {/* Price summary — auto-derived from event zone, no manual picker */}
                                {eventZone && (
                                    <div className="bg-card border-2 border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-primary uppercase tracking-widest mb-0.5">Zone / Price</p>
                                            <p className="text-sm font-bold text-foreground">{eventZone.name}</p>
                                        </div>
                                        <p className="text-lg font-black text-primary">{formatCurrency(pricePerSeat)} <span className="text-xs text-muted-foreground font-medium">/ seat</span></p>
                                    </div>
                                )}

                                {/* Payment */}
                                <div className="bg-card border-2 border-primary/20 rounded-2xl p-6">
                                    <PaymentSelector selected={paymentMethod} onChange={setPaymentMethod} />
                                </div>

                                {/* Total */}
                                {pricePerSeat > 0 && (
                                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-2xl p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total</p>
                                            <p className="text-3xl font-black text-primary">{formatCurrency(totalAmount)}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {qty} seat{qty !== 1 ? "s" : ""} × {formatCurrency(pricePerSeat)}
                                            </p>
                                        </div>
                                        <ShoppingCart className="w-8 h-8 text-primary opacity-50" />
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl p-3 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSell}
                                    disabled={selectedSeatIds.length === 0 || submitting || !customerName.trim() || !customerEmail.trim()}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-accent to-accent-dark text-background font-black uppercase tracking-wide text-sm hover:opacity-90 transition-all shadow-lg shadow-accent/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin" /> Processing…</>
                                    ) : (
                                        <><CheckCircle2 className="w-4 h-4" /> Process Sale</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}


                    {/* ── STEP 3: Receipt ── */}
                    {step === 3 && saleResult && (
                        <div className="max-w-lg mx-auto">
                            <SaleReceipt saleData={saleResult} onDone={resetSale} />
                        </div>
                    )}
                </main>
            </div>
        </RoleGuard>
    );
}
