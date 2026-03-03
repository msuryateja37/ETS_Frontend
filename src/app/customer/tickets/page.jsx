"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../../context/AuthContext";
import {
    Ticket as TicketIcon,
    Calendar,
    MapPin,
    Download,
    QrCode,
    ChevronRight,
    Trophy,
    Loader2,
    ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import Footer from "@/app/components/Footer";
import RoleGuard from "@/app/components/RoleGuard";

function getSafeId(data) {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (data?.$oid) return data.$oid;
    if (data?._id) return typeof data._id === "string" ? data._id : getSafeId(data._id);
    if (data?.id) return typeof data.id === "string" ? data.id : getSafeId(data.id);
    return null;
}

export default function MyTicketsPage() {
    const { user, token } = useAuth();
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState({});

    useEffect(() => {
        if (!user || !token) {
            setLoading(false);
            return;
        }

        const base = process.env.NEXT_PUBLIC_BACKEND_URI;
        const userId = getSafeId(user);

        if (!userId) {
            setLoading(false);
            return;
        }

        const fetchOrders = async () => {
            setLoading(true);
            try {
                // 1. Fetch orders for the user
                const orderRes = await fetch(`${base}/orders/user/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!orderRes.ok) {
                    if (orderRes.status === 401) {
                        console.warn('Session expired - unauthorized access to orders');
                        return;
                    }
                    throw new Error("Failed to fetch orders");
                }
                const orderData = await orderRes.json();

                // 2. Extract event IDs to fetch event details
                const eventIds = [...new Set(orderData.map((o) => getSafeId(o.eventId)).filter(Boolean))];

                const eventsMap = new Map();
                if (eventIds.length > 0) {
                    const batchRes = await fetch(`${base}/events/batch`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({ ids: eventIds })
                    });
                    if (batchRes.ok) {
                        const eventsList = await batchRes.json();
                        (Array.isArray(eventsList) ? eventsList : []).forEach((e) => eventsMap.set(getSafeId(e), e));
                    }
                }

                // 3. For each order, fetch its tickets and enrich data
                const enrichedOrders = await Promise.all(orderData.map(async (order) => {
                    const oid = getSafeId(order);
                    const eid = getSafeId(order.eventId);
                    const eventDetails = eventsMap.get(eid) || null;

                    // Fetch tickets for this order
                    let tickets = [];
                    try {
                        const ticketRes = await fetch(`${base}/orders/${oid}/tickets`, {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (ticketRes.ok) {
                            tickets = await ticketRes.json();
                        }
                    } catch (e) {
                        console.error(`Error fetching tickets for order ${oid}:`, e);
                    }

                    // Get venue details if event exists
                    let venueName = "Venue TBA";
                    if (eventDetails?.venueId) {
                        const vid = getSafeId(eventDetails.venueId);
                        try {
                            const vRes = await fetch(`${base}/venue/${vid}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            if (vRes.ok) {
                                const vData = await vRes.json();
                                venueName = vData.name;
                            }
                        } catch (e) { }
                    }

                    return {
                        ...order,
                        eventDetails,
                        tickets,
                        venueName,
                        ticketCount: tickets.length
                    };
                }));

                const now = new Date();
                const sortedOrders = enrichedOrders.sort((a, b) => {
                    const dateA = new Date(a.eventDetails?.startDateTime || 0);
                    const dateB = new Date(b.eventDetails?.startDateTime || 0);
                    const isUpcomingA = dateA > now;
                    const isUpcomingB = dateB > now;

                    if (isUpcomingA && !isUpcomingB) return -1;
                    if (!isUpcomingA && isUpcomingB) return 1;

                    if (isUpcomingA) return dateA - dateB;
                    return dateB - dateA;
                });

                setOrders(sortedOrders);
            } catch (err) {
                setError(err?.message || "Failed to load orders");
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, token]);

    const handleDownloadPDF = async (order) => {
        const orderId = getSafeId(order);
        setDownloading((prev) => ({ ...prev, [orderId]: true }));

        try {
            const doc = new jsPDF();
            const eventName = order.eventDetails?.name || "Event Order";
            const eventDate = (order.eventDetails?.startDateTime || order.eventDetails?.startDate)
                ? new Date(order.eventDetails.startDateTime || order.eventDetails.startDate).toLocaleDateString(undefined, {
                    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })
                : "Date TBA";
            const venueName = order.venueName || "Venue TBA";

            // Use orderCode for QR, fallback to orderId
            const codeToEncode = order.orderCode || orderId;
            const qrCodeDataUrl = await QRCode.toDataURL(codeToEncode, { width: 120 });

            // Header
            doc.setFillColor(0, 0, 0);
            doc.rect(0, 0, 210, 40, "F");
            doc.setTextColor(212, 175, 55);
            doc.setFontSize(24);
            doc.setFont(undefined, "bold");
            doc.text(eventName, 105, 25, { align: "center" });

            // Status Badge
            doc.setFillColor(16, 185, 129);
            doc.roundedRect(150, 10, 45, 8, 2, 2, "F");
            doc.setFontSize(10);
            doc.setFont(undefined, "bold");
            doc.setTextColor(255, 255, 255);
            doc.text(order.status || "VALID", 172.5, 15, { align: "center" });

            // QR Code
            doc.setTextColor(212, 175, 55);
            doc.addImage(qrCodeDataUrl, "PNG", 15, 50, 40, 40);

            // Event Details
            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.text("Event Details", 65, 55);
            doc.setFontSize(10);
            doc.setFont(undefined, "normal");
            doc.setTextColor(150, 150, 150);
            doc.text(`📅 ${eventDate}`, 65, 65);
            doc.text(`📍 ${venueName}`, 65, 72);
            doc.text(`🔢 Order ID: ${order.orderCode || orderId}`, 65, 79);

            // Tickets List
            doc.setTextColor(212, 175, 55);
            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.text("Ticket Information", 15, 105);

            let yPos = 115;
            (order.tickets || []).forEach((ticket, index) => {
                if (yPos > 250) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFillColor(26, 26, 26);
                doc.roundedRect(15, yPos, 180, 20, 3, 3, "F");
                doc.setFontSize(12);
                doc.setFont(undefined, "bold");
                doc.setTextColor(212, 175, 55);

                const zone = ticket.zoneName || "General";
                const row = ticket.seatDetails?.row || "N/A";
                const seat = ticket.seatDetails?.seatNumber || "N/A";

                doc.text(`Ticket ${index + 1}: ${zone} - Row ${row}, Seat ${seat}`, 25, yPos + 12);
                yPos += 25;
            });

            // Access Code Section (using Order Code)
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }

            doc.setTextColor(212, 175, 55);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Order Access Code', 15, yPos + 10);

            doc.setFillColor(254, 243, 199);
            doc.roundedRect(15, yPos + 15, 180, 15, 3, 3, 'F');

            doc.setFontSize(14);
            doc.setFont('courier', 'bold');
            doc.setTextColor(180, 83, 9);
            doc.text(codeToEncode, 105, yPos + 25, { align: 'center' });

            // Footer
            yPos += 50;
            if (yPos > 270) {
                doc.addPage();
                yPos = 20;
            }

            doc.setTextColor(150, 150, 150);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text('📌 Important Information:', 15, yPos);
            doc.text('• Please arrive at least 30 minutes before the event starts', 20, yPos + 7);
            doc.text('• This order includes ' + (order.ticketCount || 0) + ' tickets', 20, yPos + 13);
            doc.text('• Present the QR code or order code at the entrance for all attendees', 20, yPos + 19);

            doc.setDrawColor(50, 50, 50);
            doc.line(15, yPos + 35, 195, yPos + 35);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Order issued by ETS - Event Ticketing System', 105, yPos + 43, { align: 'center' });
            doc.text(`Order ID: ${orderId}`, 105, yPos + 49, { align: 'center' });
            doc.text(`Downloaded: ${new Date().toLocaleString()}`, 105, yPos + 55, { align: 'center' });

            const fileName = `Order_${eventName.replace(/[^a-zA-Z0-9]/g, "_")}_${codeToEncode}.pdf`;
            doc.save(fileName);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setDownloading((prev) => ({ ...prev, [orderId]: false }));
        }
    };

    if (loading) return (
        <RoleGuard allowedRoles={["CUSTOMER"]}>
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-primary font-semibold tracking-wide">Fetching your orders...</p>
                </div>
            </div>
        </RoleGuard>
    );

    return (
        <RoleGuard allowedRoles={["CUSTOMER"]}>
            <div className="min-h-screen bg-background">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Header Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-6">
                            <button
                                onClick={() => router.back()}
                                className="group flex items-center gap-2 px-5 py-2.5 bg-card border-2 border-primary/30 rounded-full text-primary font-bold hover:bg-background-hover hover:border-primary transition-all shadow-lg uppercase tracking-wider"
                            >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                <span>Back</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-primary">
                                    <TicketIcon className="w-8 h-8 text-primary-foreground" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light tracking-tight uppercase">
                                        My Tickets
                                    </h1>
                                    <p className="text-muted-foreground font-medium mt-2 tracking-wide">
                                        You have {orders.length} total bookings across {new Set(orders.map((o) => getSafeId(o.eventId))).size} events
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push('/')}
                                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-xl font-black hover:from-primary-light hover:to-primary transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/30 uppercase tracking-wider"
                            >
                                Browse More Events
                                <ChevronRight className="w-5 h-5 ml-1" />
                            </button>
                        </div>
                    </div>

                    <div className="w-full">
                        {orders.length === 0 ? (
                            <div className="w-full py-20 text-center bg-gradient-to-br from-card to-background rounded-3xl border-2 border-primary/20 shadow-xl">
                                <div className="w-28 h-28 bg-gradient-to-br from-primary/20 to-background rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-primary/30">
                                    <TicketIcon className="w-12 h-12 text-primary" />
                                </div>
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-3 uppercase tracking-wide">
                                    No orders found
                                </h2>
                                <p className="text-muted-foreground max-w-sm mx-auto mb-10 text-sm leading-relaxed">
                                    It looks like you haven't booked any events yet. Once you do, your orders will appear right here!
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {orders.map((order) => {
                                    const eventDate = order.eventDetails?.endDateTime ?? order.eventDetails?.startDateTime ?? order.eventDetails?.startDate;
                                    const isCompleted = eventDate ? new Date(eventDate) < new Date() : false;
                                    const orderId = getSafeId(order);

                                    return (
                                        <div
                                            key={orderId}
                                            className={`h-[350px] rounded-[2.5rem] overflow-hidden flex flex-col sm:flex-row shadow-xl border-2 transition-all duration-500 relative group
                                            ${isCompleted
                                                    ? 'bg-card-elevated border-primary/10 opacity-60'
                                                    : 'bg-gradient-to-br from-card to-background border-primary/30 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary'}`}
                                        >
                                            {/* Visual "Stub" Area */}
                                            <div className="w-full sm:w-56 h-40 sm:h-full relative overflow-hidden bg-background flex-shrink-0">
                                                {(order.eventDetails?.landscapeImage || order.eventDetails?.portraitImage) ? (
                                                    <img
                                                        src={order.eventDetails.landscapeImage || order.eventDetails.portraitImage}
                                                        alt={order.eventDetails.name}
                                                        className={`w-full h-full object-cover transition-all duration-700
                                                        ${isCompleted ? "opacity-40 grayscale" : "opacity-80 group-hover:scale-110 group-hover:opacity-60"}`}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-background flex items-center justify-center">
                                                        <Trophy className="w-12 h-12 text-primary/30" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>

                                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${order.status === 'COMPLETED' || order.status === 'VALID'
                                                        ? 'bg-accent/20 border-accent/40 text-accent-foreground'
                                                        : 'bg-card/60 text-muted-foreground border-primary/20'
                                                        }`}>
                                                        {order.status || 'VALID'}
                                                    </span>
                                                    {/* {isCompleted && (
                                                        <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-muted/40 border border-primary/20 text-muted-foreground backdrop-blur-md">
                                                            Completed
                                                        </span>
                                                    )} */}
                                                </div>

                                                <div className="absolute bottom-4 left-4 right-4 text-foreground">
                                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Event Type</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${isCompleted ? "bg-muted" : "bg-primary"}`}></span>
                                                        <span className="font-bold">{order.eventDetails?.category || order.eventDetails?.type || "Event"}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Main Ticket Area */}
                                            <div className={`flex-grow p-4 flex flex-col justify-between relative ${isCompleted ? 'bg-card-elevated/50' : 'bg-gradient-to-br from-card to-background'}`}>
                                                {/* Decorative Ticket Separation */}
                                                <div className="hidden sm:block absolute top-[15%] bottom-[15%] -left-[1px] w-[2px] border-l-2 border-dashed border-primary/20"></div>
                                                <div className="hidden sm:block absolute top-1/2 -left-3 -translate-y-1/2 w-6 h-6 bg-background-elevated rounded-full"></div>

                                                <div className="flex flex-col justify-center h-full">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className={`text-2xl font-black leading-tight line-clamp-1 ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                                                            {order.eventDetails?.name || "Event Name Unavailable"}
                                                        </h3>
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        <div className="flex items-center gap-4 group/item">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-muted/30' : 'bg-card-elevated group-hover/item:bg-primary/10'
                                                                }`}>
                                                                <Calendar className={`w-5 h-5 transition-colors ${isCompleted ? 'text-muted-foreground' : 'text-primary'
                                                                    }`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Date & Time</p>
                                                                <p className={`font-bold ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                                                                    {(order.eventDetails?.startDateTime || order.eventDetails?.startDate)
                                                                        ? new Date(order.eventDetails.startDateTime || order.eventDetails.startDate).toLocaleDateString(undefined, {
                                                                            month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
                                                                        })
                                                                        : "Date TBA"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 group/item">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-muted/30' : 'bg-card-elevated group-hover/item:bg-primary/10'
                                                                }`}>
                                                                <MapPin className={`w-5 h-5 transition-colors ${isCompleted ? 'text-muted-foreground' : 'text-primary'
                                                                    }`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Venue</p>
                                                                <p className={`font-bold line-clamp-1 ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                                                                    {order.venueName || "Venue TBA"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-4 group/item">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-muted/30' : 'bg-card-elevated group-hover/item:bg-primary/10'
                                                                }`}>
                                                                <TicketIcon className={`w-5 h-5 transition-colors ${isCompleted ? 'text-muted-foreground' : 'text-primary'
                                                                    }`} />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Details</p>
                                                                <p className={`font-bold ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                                                                    {order.ticketCount} Ticket{order.ticketCount !== 1 ? 's' : ''} • ID: {order.orderCode || orderId.slice(-8).toUpperCase()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 mt-2">
                                                    <button
                                                        onClick={() => handleDownloadPDF(order)}
                                                        disabled={downloading[orderId] || isCompleted}
                                                        className={`flex-grow flex items-center justify-center px-6 py-4 rounded-xl font-black transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group/btn uppercase tracking-wider
                                                        ${isCompleted
                                                                ? 'bg-muted/30 text-muted-foreground shadow-none border-2 border-primary/10'
                                                                : 'bg-gradient-to-r from-primary to-primary-dark text-primary-foreground hover:from-primary-light hover:to-primary shadow-primary/20 border-2 border-primary'}`}
                                                    >
                                                        {downloading[orderId] ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                                <span>Processing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Download className="w-5 h-5 mr-2 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                                <span>{isCompleted ? 'Event Completed' : 'Download Tickets'}</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => router.push(`/customer/orders/${orderId}`)}
                                                        disabled={isCompleted}
                                                        className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-muted/30 border-primary/10 cursor-not-allowed' : 'bg-card-elevated border-primary/30 hover:bg-primary/10'
                                                            }`}
                                                        title="View Order Details"
                                                    >
                                                        <ChevronRight className={`w-6 h-6 ${isCompleted ? 'text-muted-foreground cursor-not-allowed' : 'text-primary'}`} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <Footer />
            </div>
        </RoleGuard>
    );
}
