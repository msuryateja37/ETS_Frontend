"use client";
export const dynamic = "force-dynamic";
import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../../context/AuthContext";
import {
    CreditCard,
    Ticket,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    ShieldCheck,
    Calendar,
    MapPin,
    Loader2
} from "lucide-react";
import RoleGuard from "../components/RoleGuard";

import { useEventDetails, useEventSeats, useConfirmPurchase, getSafeId } from "../../hooks/useCustomer";

function getSectionName(venue, sectionId) {
    if (!venue?.sections || !sectionId) return "";
    const sId = getSafeId(sectionId);
    const section = venue.sections.find(s => getSafeId(s.id) === sId);
    return section ? section.name : "";
}

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, token } = useAuth();

    const eventId = searchParams.get("eventId");
    const seatIdsParam = searchParams.get("seatIds");
    const seatIds = useMemo(() =>
        seatIdsParam ? seatIdsParam.split(",").map((s) => s.trim()).filter(Boolean) : []
        , [seatIdsParam]);

    const { data: eventDetails, isLoading: eventLoading, error: eventError } = useEventDetails(eventId);
    const { data: allSeats = [], isLoading: seatsLoading, error: seatsError } = useEventSeats(eventId);
    const confirmPurchaseMutation = useConfirmPurchase();

    const [success, setSuccess] = useState(false);

    const event = eventDetails?.event;
    const venue = eventDetails?.venue;

    const heldSeats = useMemo(() => {
        if (!allSeats.length || !seatIds.length) return [];
        const idSet = new Set(seatIds);
        return allSeats.filter((s) => idSet.has(getSafeId(s._id)));
    }, [allSeats, seatIds]);

    const calculateSubtotal = () => {
        if (!heldSeats.length) return 0;
        return heldSeats.reduce((acc, seat) => acc + (Number(seat.price) || 0), 0);
    };

    const calculateTax = (subtotal) => subtotal * 0.15;

    const handleConfirmPurchase = async () => {
        const userId = getSafeId(user);
        if (!userId) {
            alert("User not authenticated");
            return;
        }

        const seatIdsToConfirm = heldSeats.map((s) => getSafeId(s._id)).filter(Boolean);

        try {
            await confirmPurchaseMutation.mutateAsync({
                seatIds: seatIdsToConfirm,
                userId: userId,
            });
            setSuccess(true);
            sessionStorage.removeItem("selectedSeats");
        } catch (err) {
            alert(err.message || "Failed to confirm purchase");
        }
    };

    const isLoading = eventLoading || seatsLoading;
    const error = eventError?.message || seatsError?.message || (!eventId || !seatIdsParam ? "Invalid checkout session. Please return to the seating selection." : null);
    const processing = confirmPurchaseMutation.isPending;

    if (isLoading) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">Preparing your checkout...</p>
            </div>
        </div>
    );

    if (error || !event) return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-xl mx-auto px-4 py-20 text-center">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
                <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
                <p className="text-muted-foreground mb-8">{error}</p>
                <button
                    onClick={() => router.push(`/`)}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded font-bold hover:bg-primary-dark transition-all"
                >
                    Return Home
                </button>
            </div>
        </div>
    );

    if (success) {
        return (
            <RoleGuard allowedRoles={["CUSTOMER"]}>
                <div className="min-h-screen bg-background">
                    <Navbar />
                    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                        <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-8">
                            <CheckCircle2 className="w-12 h-12 text-accent-foreground" />
                        </div>
                        <h1 className="text-4xl font-bold text-foreground mb-4">Booking Confirmed!</h1>
                        <p className="text-lg text-muted-foreground mb-12">
                            Your tickets for <span className="font-bold text-primary">{event.name}</span> have been successfully booked.
                        </p>

                        <div className="bg-card rounded-xl border border-border p-8 mb-12">
                            <h3 className="font-bold text-foreground mb-6 flex items-center">
                                <Ticket className="w-5 h-5 mr-3 text-primary" />
                                Reservation Summary
                            </h3>
                            <div className="space-y-4">
                                {heldSeats.map((seat) => (
                                    <div key={getSafeId(seat._id) || seat.row + seat.seatNumber} className="flex justify-between items-center bg-background-elevated p-4 rounded border border-border">
                                        <div>
                                            <p className="font-bold text-foreground">
                                                {getSectionName(venue, seat.sectionId) && `${getSectionName(venue, seat.sectionId)} - `}
                                                Row {seat.row}, Seat {seat.seatNumber}
                                            </p>
                                            <p className="text-sm text-primary">{seat.zoneName || "Standard"}</p>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-accent" />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 pt-8 border-t border-border flex justify-between items-center text-xl">
                                <span className="font-bold text-foreground">Total Paid</span>
                                <span className="font-black text-primary">{event.currency || "R"} {(calculateSubtotal() + calculateTax(calculateSubtotal())).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => router.push('/customer/tickets')}
                                className="px-8 py-3 bg-primary text-primary-foreground rounded font-bold hover:bg-primary-dark transition-all"
                            >
                                My Tickets
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="px-8 py-3 bg-transparent border-2 border-primary text-primary rounded font-bold hover:bg-background-hover transition-all"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                </div>
            </RoleGuard>
        );
    }

    const subtotal = calculateSubtotal();
    const tax = calculateTax(subtotal);
    const total = subtotal + tax;

    return (
        <RoleGuard allowedRoles={["CUSTOMER"]}>
            <div className="min-h-screen bg-background">
                <Navbar />

                <main className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Left Column: Summary & Payment */}
                        <div className="flex-grow space-y-8">
                            <div className="bg-card rounded-xl p-8 border border-border">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold text-foreground">Secure Checkout</h2>
                                </div>

                                {/* Event Mini Card */}
                                <div className="flex gap-6 p-4 bg-background-elevated rounded-xl border border-border mb-8">
                                    {(event.landscapeImage || event.portraitImage) && (
                                        <img src={event.landscapeImage || event.portraitImage} alt={event.name} className="w-24 h-32 object-cover rounded shadow-md" />
                                    )}
                                    <div className="flex flex-col justify-center">
                                        <h3 className="text-xl font-bold text-foreground mb-2">{event.name}</h3>
                                        <div className="space-y-1 text-muted-foreground text-sm">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-2 text-primary" />
                                                {(event.startDateTime || event.startDate) && new Date(event.startDateTime || event.startDate).toLocaleDateString(undefined, {
                                                    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                                                })}
                                            </div>
                                            <div className="flex items-center text-primary font-medium">
                                                <MapPin className="w-4 h-4 mr-2" />
                                                {venue?.name || "Venue"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Seats Selection */}
                                <div className="mb-8">
                                    <h3 className="font-bold text-foreground mb-4">Your Selection</h3>
                                    <div className="space-y-3">
                                        {heldSeats.map((seat) => (
                                            <div key={getSafeId(seat._id) || seat.row + seat.seatNumber} className="flex justify-between items-center p-4 rounded border border-border hover:border-primary transition-colors bg-background-elevated">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 bg-primary/20 text-primary rounded flex items-center justify-center mr-4">
                                                        <Ticket className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground">
                                                            {getSectionName(venue, seat.sectionId) && `${getSectionName(venue, seat.sectionId)} - `}
                                                            Row {seat.row}, Seat {seat.seatNumber}
                                                        </p>
                                                        <p className="text-xs text-primary uppercase tracking-wider">{seat.zoneName || "Standard"}</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-primary">
                                                    {event.currency || "R"} {(Number(seat.price) || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Method Interface */}
                                <div className="space-y-4">
                                    <h3 className="font-bold text-foreground mb-2">Payment Method</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded border-2 border-primary bg-primary/10 flex flex-col justify-between h-32">
                                            <div className="flex justify-between items-start">
                                                <CreditCard className="w-8 h-8 text-primary" />
                                                <CheckCircle2 className="w-6 h-6 text-primary" />
                                            </div>
                                            <p className="font-bold text-foreground">Card Payment</p>
                                        </div>
                                        <div className="p-4 rounded border-2 border-border bg-card flex flex-col justify-between h-32 opacity-50">
                                            <div className="flex justify-between items-start">
                                                <div className="text-2xl font-black text-muted-foreground italic">PayFast</div>
                                            </div>
                                            <p className="font-bold text-muted-foreground">Electronic Funds</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center text-muted-foreground text-sm gap-4">
                                <div className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1" /> Secure Encryption</div>
                                <div className="flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> No Hidden Fees</div>
                            </div>
                        </div>

                        {/* Right Column: Order Summary Card */}
                        <div className="lg:w-96">
                            <div className="bg-card-elevated text-foreground rounded-xl p-8 sticky top-10 border border-primary/20">
                                <h3 className="text-xl font-bold mb-8 text-foreground">Order Summary</h3>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Subtotal ({heldSeats.length} seats)</span>
                                        <span className="text-foreground">{event.currency || "R"} {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Booking Fee (15%)</span>
                                        <span className="text-foreground">{event.currency || "R"} {tax.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-border my-6"></div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-muted-foreground text-sm">Total Amount</p>
                                            <p className="text-3xl font-black text-primary">{event.currency || "R"} {total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        onClick={handleConfirmPurchase}
                                        disabled={processing}
                                        className="w-full py-4 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed rounded font-bold text-primary-foreground text-lg transition-all flex items-center justify-center space-x-2"
                                    >
                                        {processing ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <>
                                                <span>Complete Purchase</span>
                                                <ChevronRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-xs text-muted-foreground px-4">
                                        By clicking complete purchase, you agree to our Terms of Service.
                                    </p>
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

export default function CheckoutPage() {
    return (
        <RoleGuard allowedRoles={["CUSTOMER"]}>
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse"></div>
                    </div>
                </div>
            }>
                <CheckoutContent />
            </Suspense>
        </RoleGuard >
    );
}