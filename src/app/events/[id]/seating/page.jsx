"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import VenueMap from "../../../components/VenueMap";
import { useAuth } from "../../../../context/AuthContext";
import { ArrowLeft, ShoppingCart, Loader2, MapPin, Calendar, Clock, Ticket, CheckCircle, Crown, Sparkles } from "lucide-react";
import { io } from "socket.io-client";
import RoleGuard from "@/app/components/RoleGuard";
import { formatDate, formatTime } from "@/app/utils/dateUtils";

import { useEventDetails, useEventSeats, useLockSeats, getSafeId } from "../../../../hooks/useCustomer";
import { useQueryClient } from "@tanstack/react-query";

export default function EventSeatingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const queryClient = useQueryClient();

  const eventId = params?.id ? getSafeId(params.id) : null;
  const role = user?.role || 'CUSTOMER';
  const isPOS = role === 'TICKETING';

  const { data: eventDetails, isLoading: eventLoading, error: eventError } = useEventDetails(eventId, role);
  const { data: seats = [], isLoading: seatsLoading, error: seatsError } = useEventSeats(eventId);
  const lockSeatsMutation = useLockSeats();

  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [socket, setSocket] = useState(null);

  const event = eventDetails?.event;
  const venue = eventDetails?.venue;

  useEffect(() => {
    if (!eventId) return;

    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URI || "http://localhost:3001", {
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      newSocket.emit("join-event", eventId);
    });

    newSocket.on("seatStatusChanged", ({ seatId, status }) => {
      console.log(`Seat ${seatId} changed to ${status}`);

      // Update the TanStack Query cache for seats
      queryClient.setQueryData(["event-seats", eventId], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((s) => (getSafeId(s._id) === seatId ? { ...s, status } : s));
      });

      if (status === "AVAILABLE" || status === "SOLD" || status === "BLOCKED") {
        setSelectedSeats((prev) => {
          if (prev.has(seatId)) {
            const next = new Set(prev);
            next.delete(seatId);
            return next;
          }
          return prev;
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit("leave-event", eventId);
      newSocket.disconnect();
    };
  }, [eventId, queryClient]);

  const seatIdStr = (s) => getSafeId(s?._id) ?? s?._id;

  // Build zone mapping
  const sectionToZoneMap = new Map();
  const zoneInfo = new Map();

  if (event?.zones && Array.isArray(event.zones)) {
    event.zones.forEach((zone, idx) => {
      if (!zone.name || typeof zone.price !== "number") return;

      const zoneSections = [];

      if (Array.isArray(zone.sections)) {
        zone.sections.forEach((sectionRef) => {
          const sectionId = getSafeId(sectionRef);
          if (sectionId) {
            zoneSections.push(sectionId);
            sectionToZoneMap.set(sectionId, {
              zoneName: zone.name,
              price: zone.price,
              zoneIndex: idx
            });
          }
        });
      }

      zoneInfo.set(zone.name, {
        price: zone.price,
        sections: zoneSections,
        index: idx
      });
    });
  }

  const enrichedSeats = seats.map((seat) => {
    const sectionId = getSafeId(seat.sectionId ?? seat.zoneId);
    const zoneData = sectionToZoneMap.get(sectionId);

    if (zoneData && typeof zoneData.price === "number") {
      return {
        ...seat,
        price: seat.price ?? zoneData.price,
        zoneName: zoneData.zoneName,
        zoneIndex: zoneData.zoneIndex
      };
    }

    return seat;
  });

  const handleSeatClick = async (seat) => {
    const sid = seatIdStr(seat);
    if (!sid) return;

    if (selectedSeats.has(sid)) {
      setSelectedSeats((prev) => {
        const next = new Set(prev);
        next.delete(sid);
        return next;
      });
      return;
    }

    if (seat.status !== "AVAILABLE") return;

    if (!user) {
      alert("Please login to select seats");
      router.push("/auth/login");
      return;
    }

    setSelectedSeats((prev) => {
      const next = new Set(prev);
      next.add(sid);
      return next;
    });
  };

  const calculateTotal = () => {
    let total = 0;
    selectedSeats.forEach((seatId) => {
      const seat = enrichedSeats.find((s) => seatIdStr(s) === seatId);
      if (seat && typeof seat.price === "number") total += seat.price;
    });
    return total;
  };

  const handleCheckout = async () => {
    if (selectedSeats.size === 0) {
      alert("Please select at least one seat");
      return;
    }
    const userId = getSafeId(user);
    if (!userId) {
      alert("Please login to book tickets");
      router.push("/auth/login");
      return;
    }

    try {
      const eid = getSafeId(event);
      const seatIds = Array.from(selectedSeats);

      if (isPOS) {
        // POS staff: redirect back to POS sell page with seat selection
        const seatIdsParam = seatIds.join(",");
        router.push(`/pos/sell?eventId=${eid}&seatIds=${encodeURIComponent(seatIdsParam)}`);
        return;
      }

      await lockSeatsMutation.mutateAsync({
        eventSeatIds: seatIds,
        userId: userId,
      });

      const seatIdsParam = seatIds.join(",");
      router.push(`/checkout?eventId=${eid}&seatIds=${encodeURIComponent(seatIdsParam)}`);
    } catch (err) {
      console.error("Checkout locking error:", err);
      alert(err.message);
      // Refetch seats on error to get latest status
      queryClient.invalidateQueries({ queryKey: ["event-seats", eventId] });
    }
  };

  const loading = eventLoading || seatsLoading;
  const error = eventError?.message || seatsError?.message;
  const isLocking = lockSeatsMutation.isPending;

  if (loading) {
    return (
      <RoleGuard allowedRoles={["CUSTOMER", "TICKETING"]}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-lg font-bold text-primary uppercase tracking-wider">Loading seating map</p>
              <p className="text-sm text-muted-foreground mt-2">Please wait...</p>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error || !event || !venue) {
    return (
      <RoleGuard allowedRoles={["CUSTOMER", "TICKETING"]}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="text-center max-w-md mx-4">
              <div className="bg-gradient-to-br from-card to-background rounded-2xl shadow-2xl p-8 border-2 border-destructive/30">
                <Crown className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h3 className="text-xl font-black text-foreground mb-2">Unable to Load Seating</h3>
                <p className="text-muted-foreground mb-6">
                  {error || "Event or venue information not found"}
                </p>
                <button
                  onClick={() => router.back()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-xl font-bold hover:from-primary-light hover:to-primary transition-all shadow-lg shadow-primary/30"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["CUSTOMER", "TICKETING"]}>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Premium Sticky Header */}
        <header className="bg-card/90 sticky top-0 z-40 backdrop-blur-xl border-b-2 border-primary/20 shadow-lg">
          <div className="max-w-[1920px] mx-auto px-6 lg:px-12">
            <div className="flex items-center justify-between py-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-5 py-2.5 bg-card border-2 border-primary/30 rounded-full text-primary font-bold hover:bg-background-hover hover:border-primary transition-all shadow-lg uppercase tracking-wider"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="flex items-center space-x-6">
                <div className="hidden md:flex items-center space-x-2.5 px-4 py-2 bg-card-elevated rounded-xl border border-primary/10">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{formatDate(event.startDateTime)}</span>
                </div>
                <div className="hidden md:flex items-center space-x-2.5 px-4 py-2 bg-card-elevated rounded-xl border border-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{formatTime(event.startDateTime)}</span>
                </div>
                <div className="hidden lg:flex items-center space-x-2.5 px-4 py-2 bg-card-elevated rounded-xl border border-primary/10">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-foreground">{venue.name}</span>
                </div>
              </div>

              {selectedSeats.size > 0 && (
                <div className="flex items-center space-x-3 px-5 py-2.5 bg-gradient-to-r from-accent/20 to-accent-dark/20 rounded-xl border-2 border-accent/40 shadow-lg shadow-accent/10">
                  <CheckCircle className="w-5 h-5 text-accent-foreground" />
                  <span className="text-sm font-black text-accent-foreground uppercase tracking-wider">
                    {selectedSeats.size} Selected
                  </span>
                </div>
              )}
            </div>

            {/* Event Title Bar */}
            <div className="py-4 border-t-2 border-primary/10">
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light tracking-tight uppercase">
                {event.name}
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-full mx-auto px-6 lg:px-12 py-8">
          {isLocking && (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-gradient-to-br from-card to-background rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full border-2 border-primary/30">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-wide">Reserving Your Seats</h3>
                  <p className="text-muted-foreground">Please wait...</p>
                </div>
              </div>
            </div>
          )}

          {/* Full Width Map Container */}
          <div className="bg-gradient-to-br from-card to-background rounded-2xl shadow-2xl overflow-hidden border-2 border-primary/20">
            <VenueMap
              venue={venue}
              eventId={getSafeId(event)}
              seats={enrichedSeats}
              onSeatClick={handleSeatClick}
              selectedSeatIds={selectedSeats}
              sectionToZoneMap={sectionToZoneMap}
              zoneInfo={zoneInfo}
              currency={event.currency || "R"}
            />
          </div>
        </main>

        {/* Floating Checkout Bar */}
        {selectedSeats.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-7xl px-2 z-50">
            <div className="bg-gradient-to-r from-card via-card-elevated to-card backdrop-blur-xl px-6 py-4 rounded-3xl border-2 border-primary/30 shadow-[0_20px_50px_rgba(212,175,55,0.2)] flex items-center justify-between gap-8">
              <div className="flex items-center space-x-6">
                <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl shadow-lg shadow-primary/30 border-2 border-primary">
                  <Ticket className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">
                    {selectedSeats.size} Seat{selectedSeats.size !== 1 ? 's' : ''} Ready
                  </p>
                  <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light tracking-tight">
                    {event.currency || "R"} {calculateTotal().toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isLocking}
                className="flex items-center space-x-4 px-10 py-4 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:from-primary-light hover:to-primary transition-all shadow-lg shadow-primary/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed group border-2 border-primary"
              >
                {isLocking ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{isPOS ? "Continue to POS" : "Confirm Selection"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </RoleGuard>
  );
}