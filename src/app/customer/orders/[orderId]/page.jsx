"use client";
import React, { useState, useEffect } from "react";
import Navbar from "../../../components/Navbar";
import { useAuth } from "../../../../context/AuthContext";
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
    Tag,
    CreditCard,
    CircleCheck,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
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
    if (typeof data.toString === "function" && data.toString() !== "[object Object]") {
        return data.toString();
    }
    return null;
}

export default function OrderDetailsPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const orderId = params.orderId;

    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState("");

    useEffect(() => {
        if (!user || !token || !orderId) return;

        const base = process.env.NEXT_PUBLIC_BACKEND_URI;

        const fetchOrderDetails = async () => {
            setLoading(true);
            try {
                // Fetch order with tickets
                const res = await fetch(`${base}/orders/${orderId}/with-tickets`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!res.ok) {
                    if (res.status === 401) {
                        console.warn('Session expired - unauthorized access');
                        return;
                    }
                    throw new Error("Failed to fetch order details");
                }
                const data = await res.json();

                const order = data.order;
                const tickets = data.tickets;

                // Fetch event details
                const eid = getSafeId(order.eventId);
                let eventDetails = null;
                if (eid) {
                    const eRes = await fetch(`${base}/events/${eid}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (eRes.ok) {
                        eventDetails = await eRes.json();
                    }
                }

                // Fetch venue details
                let venueDetails = null;
                if (eventDetails?.venueId) {
                    const vid = getSafeId(eventDetails.venueId);
                    const vRes = await fetch(`${base}/venue/${vid}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    if (vRes.ok) {
                        venueDetails = await vRes.json();
                    }
                }

                // Fetch seat details for each ticket
                const ticketsWithSeats = await Promise.all(tickets.map(async (ticket) => {
                    const sid = getSafeId(ticket.seatId);
                    let seatDetails = null;
                    if (sid) {
                        try {
                            const sRes = await fetch(`${base}/seats/${sid}`, {
                                headers: {
                                    'Authorization': `Bearer ${token}`
                                }
                            });
                            if (sRes.ok) {
                                seatDetails = await sRes.json();
                            }
                        } catch (e) { }
                    }
                    return { ...ticket, seatDetails };
                }));

                const finalData = {
                    ...order,
                    eventDetails,
                    venueDetails,
                    tickets: ticketsWithSeats,
                    ticketCount: tickets.length
                };

                setOrderData(finalData);

                // Generate QR Code for order
                const codeToEncode = finalData.orderCode || orderId;
                const qrUrl = await QRCode.toDataURL(codeToEncode, { width: 300 });
                setQrCodeUrl(qrUrl);

            } catch (err) {
                setError(err?.message || "Failed to load order details");
            } finally {
                setLoading(false);
            }
        };

        fetchOrderDetails();
    }, [user, orderId, token]);

    const handleDownloadPDF = async () => {
        if (!orderData) return;
        setDownloading(true);

        try {
            const doc = new jsPDF();
            const eventName = orderData.eventDetails?.name || "Event Order";
            const eventDate = (orderData.eventDetails?.startDateTime || orderData.eventDetails?.startDate)
                ? new Date(orderData.eventDetails.startDateTime || orderData.eventDetails.startDate).toLocaleDateString(undefined, {
                    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })
                : "Date TBA";
            const venueName = orderData.venueDetails?.name || "Venue TBA";

            const codeToEncode = orderData.orderCode || orderId;
            const qrCodeDataUrl = await QRCode.toDataURL(codeToEncode, { width: 120 });

            doc.setFillColor(0, 0, 0);
            doc.rect(0, 0, 210, 40, "F");
            doc.setTextColor(212, 175, 55);
            doc.setFontSize(24);
            doc.setFont(undefined, "bold");
            doc.text(eventName, 105, 25, { align: "center" });

            const isEventCompleted = orderData.eventDetails?.endDateTime ? new Date(orderData.eventDetails.endDateTime) < new Date() : false;
            let orderDisplayStatus = orderData.status || "VALID";
            if (isEventCompleted && orderDisplayStatus === "VALID") {
                orderDisplayStatus = "EXPIRED";
            }

            doc.setFillColor(16, 185, 129);
            doc.roundedRect(150, 10, 45, 8, 2, 2, "F");
            doc.setFontSize(10);
            doc.setFont(undefined, "bold");
            doc.setTextColor(255, 255, 255);
            doc.text(orderDisplayStatus, 172.5, 15, { align: "center" });

            doc.setTextColor(212, 175, 55);
            doc.addImage(qrCodeDataUrl, "PNG", 15, 50, 40, 40);

            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.text("Event Details", 65, 55);
            doc.setFontSize(10);
            doc.setFont(undefined, "normal");
            doc.setTextColor(150, 150, 150);
            doc.text(`Date: ${eventDate}`, 65, 65);
            doc.text(`Venue: ${venueName}`, 65, 72);
            doc.text(`Order ID: ${orderData.orderCode || orderId}`, 65, 79);

            doc.setTextColor(212, 175, 55);
            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.text("Order Summary & Payment", 15, 105);

            let yPos = 115;
            doc.setFillColor(26, 26, 26);
            doc.roundedRect(15, yPos, 180, 50, 3, 3, "F");

            doc.setFontSize(10);
            doc.setTextColor(200, 200, 200);
            doc.setFont(undefined, "normal");

            const subtotal = orderData.totalAmount || 0;
            const discount = orderData.discountAmount || 0;
            const tax = orderData.tax || 0;
            const wallet = orderData.walletAmountUsed || 0;
            const final = orderData.finalAmount || 0;
            const currency = orderData.currency || "ZAR";

            doc.text("Subtotal:", 25, yPos + 10);
            doc.text(`${currency} ${subtotal.toFixed(2)}`, 185, yPos + 10, { align: "right" });

            if (discount > 0) {
                doc.text("Discount:", 25, yPos + 17);
                doc.setTextColor(239, 68, 68); // Red for discount
                doc.text(`- ${currency} ${discount.toFixed(2)}`, 185, yPos + 17, { align: "right" });
                doc.setTextColor(200, 200, 200);
            }

            doc.text("Tax:", 25, yPos + 24);
            doc.text(`${currency} ${tax.toFixed(2)}`, 185, yPos + 24, { align: "right" });

            if (wallet > 0) {
                doc.text("Wallet Amount Used:", 25, yPos + 31);
                doc.text(`${currency} ${wallet.toFixed(2)}`, 185, yPos + 31, { align: "right" });
            }

            doc.setDrawColor(50, 50, 50);
            doc.line(25, yPos + 35, 185, yPos + 35);

            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.setTextColor(212, 175, 55);
            doc.text("Total Paid:", 25, yPos + 43);
            doc.text(`${currency} ${final.toFixed(2)}`, 185, yPos + 43, { align: "right" });

            yPos += 65;

            doc.setFontSize(12);
            doc.setFont(undefined, "bold");
            doc.text("Ticket Information", 15, yPos);
            yPos += 10;

            (orderData.tickets || []).forEach((ticket, index) => {
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

                // Robust section matching
                const targetSid = getSafeId(ticket.seatDetails?.sectionId || ticket.seatDetails?.zoneId || ticket.sectionId || ticket.zoneId);
                const section = orderData.venueDetails?.sections?.find(s =>
                    getSafeId(s.id) === targetSid ||
                    getSafeId(s._id) === targetSid ||
                    getSafeId(s.sectionId) === targetSid
                );
                const sectionName = section?.name || "N/A";

                const row = ticket.seatDetails?.row || "N/A";
                const seat = ticket.seatDetails?.seatNumber || "N/A";

                doc.text(`Ticket ${index + 1}: ${zone} - ${sectionName}`, 25, yPos + 7);
                doc.setFontSize(10);
                doc.setFont(undefined, "normal");
                doc.text(`Row ${row}, Seat ${seat}`, 25, yPos + 14);

                yPos += 25;
            });

            if (yPos > 240) { doc.addPage(); yPos = 20; }
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

            yPos += 50;
            if (yPos > 270) { doc.addPage(); yPos = 20; }
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(9);
            doc.setFont(undefined, 'normal');
            doc.text('Important Information:', 15, yPos);
            doc.text('- Please arrive at least 30 minutes before the event starts', 20, yPos + 7);
            doc.text('- This order includes ' + (orderData.ticketCount || 0) + ' tickets', 20, yPos + 13);
            doc.text('- Present the QR code or order code at the entrance for all attendees', 20, yPos + 19);

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
            alert("Failed to generate PDF.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) return (
        <RoleGuard allowedRoles={["CUSTOMER"]}>
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        </RoleGuard>
    );

    if (error || !orderData) return (
        <RoleGuard allowedRoles={["CUSTOMER"]}>
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <h2 className="text-2xl font-bold text-red-500 mb-4">{error || "Order not found"}</h2>
                <button onClick={() => router.back()} className="px-6 py-2 bg-primary text-white rounded-lg">Go Back</button>
            </div>
        </RoleGuard>
    );

    const eventEndDate = orderData.eventDetails?.endDateTime || orderData.eventDetails?.startDate;
    const isCompleted = eventEndDate ? new Date(eventEndDate) < new Date() : false;

    const eventDateStr = (orderData.eventDetails?.startDateTime || orderData.eventDetails?.startDate)
        ? new Date(orderData.eventDetails.startDateTime || orderData.eventDetails.startDate).toLocaleDateString(undefined, {
            weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
        })
        : "Date TBA";

    return (
        <RoleGuard allowedRoles={["CUSTOMER"]}>
            <div className="min-h-screen bg-background">
                <Navbar />

                <main className="max-w-5xl mx-auto px-4 py-8">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-primary font-bold mb-8 hover:underline"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to My Orders
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Summary & QR Section */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-card rounded-3xl p-6 border-2 border-primary/20 shadow-xl text-center">
                                <h2 className="text-xl font-black uppercase text-primary mb-4">Order QR Code</h2>
                                <div className="bg-white p-4 rounded-2xl inline-block mb-4">
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} alt="Order QR Code" className="w-48 h-48 mx-auto" />
                                    ) : (
                                        <div className="w-48 h-48 bg-muted animate-pulse rounded-xl" />
                                    )}
                                </div>
                                <p className="text-sm font-mono font-bold text-muted-foreground bg-muted/30 py-2 px-4 rounded-lg inline-block">
                                    {orderData.orderCode || orderId}
                                </p>
                                <p className="text-xs text-muted-foreground mt-4 px-4">
                                    Scan this code at the venue entrance to admit all guests in this order.
                                </p>
                            </div>

                            <div className="bg-card rounded-3xl p-6 border-2 border-primary/20 shadow-xl">
                                <h3 className="text-lg font-black uppercase text-primary mb-4 flex items-center gap-2">
                                    <Tag className="w-5 h-5" />
                                    Order Summary
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${isCompleted
                                            ? (orderData.status === 'USED' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground')
                                            : 'bg-green-500/10 text-green-500'
                                            }`}>
                                            {isCompleted
                                                ? (orderData.status === 'USED' ? "USED" : (orderData.status === 'VALID' ? "EXPIRED" : orderData.status))
                                                : (orderData.status || "VALID")}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Total Paid</span>
                                        <span className="font-bold text-lg">{orderData.currency} {orderData.finalAmount?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Tickets</span>
                                        <span className="font-bold">{orderData.ticketCount}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-t border-primary/10 pt-4">
                                        <span className="text-muted-foreground">Payment ID</span>
                                        <span className="text-xs font-mono">{orderData.payment?.transactionId || "N/A"}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleDownloadPDF}
                                disabled={downloading}
                                className="hover:cursor-pointer w-full flex items-center justify-center gap-3 py-4 bg-primary text-primary-foreground rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {downloading ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <Download className="w-6 h-6" />
                                )}
                                {isCompleted ? "DOWNLOAD RECEIPT" : "DOWNLOAD E-TICKETS"}
                            </button>
                        </div>

                        {/* Event & Tickets Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card rounded-[2.5rem] overflow-hidden border-2 border-primary/20 shadow-xl">
                                <div className="h-64 relative">
                                    <img
                                        src={orderData.eventDetails?.landscapeImage || orderData.eventDetails?.portraitImage || "/api/placeholder/800/400"}
                                        alt={orderData.eventDetails?.name}
                                        className={`w-full h-full object-cover ${isCompleted ? 'grayscale' : ''}`}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                                    <div className="absolute bottom-6 left-8 right-8 text-foreground">
                                        <span className="px-4 py-1.5 bg-primary/20 backdrop-blur-md rounded-lg text-xs font-black text-primary border border-primary/30 uppercase tracking-widest mb-4 inline-block">
                                            {orderData.eventDetails?.category || "Event"}
                                        </span>
                                        <h1 className="text-4xl font-black flex items-center gap-3">
                                            {orderData.eventDetails?.name}
                                            {isCompleted && (
                                                <span className="text-sm bg-muted/80 backdrop-blur-sm text-muted-foreground px-3 py-1 rounded-full border border-white/10">
                                                    PAST EVENT
                                                </span>
                                            )}
                                        </h1>
                                    </div>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-primary">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">When</p>
                                            <p className="font-bold">{eventDateStr}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center text-primary">
                                            <MapPin className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">Where</p>
                                            <p className="font-bold">{orderData.venueDetails?.name || "TBA"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card rounded-[2.5rem] p-8 border-2 border-primary/20 shadow-xl">
                                <h3 className="text-2xl font-black uppercase text-primary mb-8 flex items-center gap-3">
                                    <TicketIcon className="w-8 h-8" />
                                    Included Tickets ({orderData.ticketCount})
                                </h3>
                                <div className="space-y-4">
                                    {orderData.tickets?.map((ticket, index) => (
                                        <div key={getSafeId(ticket)} className="group bg-muted/30 rounded-2xl p-5 border-2 border-transparent hover:border-primary/30 transition-all">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-lg">
                                                            {ticket.zoneName || "General Section"} - {
                                                                (() => {
                                                                    const targetSid = getSafeId(ticket.seatDetails?.sectionId || ticket.seatDetails?.zoneId || ticket.sectionId || ticket.zoneId);
                                                                    const section = orderData.venueDetails?.sections?.find(s =>
                                                                        getSafeId(s.id) === targetSid ||
                                                                        getSafeId(s._id) === targetSid ||
                                                                        getSafeId(s.sectionId) === targetSid
                                                                    );
                                                                    return section?.name || "N/A";
                                                                })()
                                                            }
                                                        </p>
                                                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                                                            Row {ticket.seatDetails?.row || "N/A"} • Seat {ticket.seatDetails?.seatNumber || "N/A"}
                                                            <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                                                            {orderData.currency} {ticket.pricePaid?.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className={`flex items-center gap-2 font-bold px-4 py-1.5 rounded-full text-xs ${isCompleted
                                                    ? (ticket.status === 'USED' ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground')
                                                    : 'text-green-500 bg-green-500/10'
                                                    }`}>
                                                    <CircleCheck className="w-4 h-4" />
                                                    {isCompleted
                                                        ? (ticket.status === 'USED' ? 'USED' : 'EXPIRED')
                                                        : 'VALID'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </RoleGuard>
    );
}
