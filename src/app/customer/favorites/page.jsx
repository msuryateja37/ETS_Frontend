"use client";

import { useState } from "react";
import { Star, Calendar, MapPin, Heart, StarOff, ArrowLeft, ChevronRight, Sparkles, Crown } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import { formatDate } from "@/app/utils/dateUtils";
import RoleGuard from "@/app/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { formatLikes } from "../../utils/formatLikes";
import Footer from "@/app/components/Footer";

import { useCustomerProfile, useLikedEvents, useToggleFavorite, getSafeId } from "../../../hooks/useCustomer";
import { Loader2 } from "lucide-react";

export default function FavoritesPage() {
    const { user, token } = useAuth();
    const router = useRouter();

    const { data: customerData, isLoading: customerLoading, error: customerError } = useCustomerProfile(getSafeId(user));
    const favoriteEventIds = customerData?.Favorites || [];
    const { data: favoriteEvents = [], isLoading: eventsLoading, error: eventsError } = useLikedEvents(favoriteEventIds);
    const toggleFavoriteMutation = useToggleFavorite();

    const [searchQuery, setSearchQuery] = useState("");

    const isLoading = customerLoading || eventsLoading;
    const error = customerError?.message || eventsError?.message;

    const handleUnfavorite = async (eventId, e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!customerData?._id) {
            alert('Unable to process request. Please refresh the page.');
            return;
        }

        try {
            await toggleFavoriteMutation.mutateAsync({
                customerId: customerData._id,
                eventId,
                isFavorite: true // indicates it is currently in favorites, so should be removed
            });
        } catch (err) {
            console.error('Error unfavoriting event:', err);
            alert(err.message || 'Failed to unfavorite event');
        }
    };

    const handleEventClick = (eventId) => {
        router.push(`/events/${eventId}`);
    };

    const filteredEvents = favoriteEvents.filter(event => {
        const searchLower = searchQuery.toLowerCase();
        const dateStr = formatDate(event.startDateTime || event.startDate).toLowerCase();
        return (
            event.name?.toLowerCase().includes(searchLower) ||
            event.category?.toLowerCase().includes(searchLower) ||
            (event.venue?.name?.toLowerCase().includes(searchLower)) ||
            dateStr.includes(searchLower)
        );
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-yellow-500 font-semibold tracking-wide">Loading your favorites...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center max-w-md bg-gradient-to-br from-card to-background p-8 rounded-2xl shadow-2xl border border-primary/30">
                    <div className="bg-destructive/30 border border-destructive/50 text-destructive-foreground px-6 py-4 rounded-xl mb-6">
                        <p className="font-bold mb-1">Error Loading Favorites</p>
                        <p className="text-sm">{error}</p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground font-bold rounded-xl hover:from-primary-light hover:to-primary transition-all shadow-lg shadow-primary/30"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={["CUSTOMER"]}>
            <div className="min-h-screen bg-background pb-20">
                <Navbar
                    showSearch={true}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

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

                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 border-2 border-yellow-400">
                                <Star className="w-8 h-8 text-black fill-black" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200 tracking-tight uppercase">
                                    My Favorites
                                </h1>
                                <p className="text-muted-foreground font-medium mt-2 tracking-wide">
                                    {filteredEvents.length === 0 && searchQuery
                                        ? "No events match your search"
                                        : favoriteEvents.length === 0
                                            ? "You haven't favorited any events yet"
                                            : `You have ${favoriteEvents.length} favorite event${favoriteEvents.length !== 1 ? 's' : ''} saved`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {favoriteEvents.length === 0 ? (
                        /* Empty State */
                        <div className="w-full py-20 text-center bg-gradient-to-br from-card to-background rounded-3xl border-2 border-primary/20 shadow-xl">
                            <div className="w-28 h-28 bg-gradient-to-br from-yellow-500/20 to-background rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-yellow-500/30">
                                <StarOff className="w-12 h-12 text-yellow-500" />
                            </div>
                            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200 mb-3 uppercase tracking-wide">
                                No Favorites Yet
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-10 text-sm leading-relaxed">
                                Click the star icon on any event page to save your favorite upcoming experiences here.
                            </p>
                            <button
                                onClick={() => router.push('/')}
                                className="px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-xl hover:from-primary-light hover:to-primary transition-all shadow-lg shadow-primary/30 font-black uppercase tracking-wider"
                            >
                                Discover Events
                            </button>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        /* No Search Results */
                        <div className="w-full py-20 text-center bg-gradient-to-br from-card to-background rounded-3xl border-2 border-primary/20 shadow-xl">
                            <div className="w-28 h-28 bg-gradient-to-br from-primary/20 to-background rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-primary/30">
                                <StarOff className="w-12 h-12 text-primary/40" />
                            </div>
                            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light mb-3 uppercase tracking-wide">
                                No Match Found
                            </h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-10 text-sm leading-relaxed">
                                We couldn't find any events matching "{searchQuery}". Try a different search term.
                            </p>
                            <button
                                onClick={() => setSearchQuery("")}
                                className="px-8 py-4 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-xl hover:from-primary-light hover:to-primary transition-all shadow-lg shadow-primary/30 font-black uppercase tracking-wider"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        /* Events Grid */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredEvents.map((event) => (
                                <div
                                    key={event._id}
                                    onClick={() => handleEventClick(event._id)}
                                    className="group bg-card-elevated rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col h-full"
                                >
                                    {/* Image Container */}
                                    <div className="relative aspect-[3/2] overflow-hidden bg-background">
                                        <img
                                            src={event.landscapeImage || event.portraitImage || `https://source.unsplash.com/800x600/?${encodeURIComponent(event.category)},event`}
                                            alt={event.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/400x300/1e293b/D4AF37?text=' + encodeURIComponent(event.name);
                                            }}
                                        />

                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

                                        {/* Top Badges */}
                                        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                                            <span className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary-dark text-primary-foreground rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg border border-primary">
                                                {event.category}
                                            </span>

                                            <button
                                                onClick={(e) => handleUnfavorite(event._id, e)}
                                                disabled={toggleFavoriteMutation.isPending}
                                                className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-2 border-yellow-400 ${toggleFavoriteMutation.isPending ? 'opacity-70 cursor-wait' : 'hover:scale-110 active:scale-95'
                                                    }`}
                                                title="Remove from favorites"
                                            >
                                                {toggleFavoriteMutation.isPending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                                                ) : (
                                                    <Star className="w-4 h-4 fill-black text-black" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Status Badge */}
                                        {(() => {
                                            const now = new Date();
                                            const isOver = event.endDateTime && new Date(event.endDateTime) < now;
                                            if (isOver) {
                                                return (
                                                    <div className="absolute bottom-3 left-3 bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full font-bold shadow-lg flex items-center gap-1.5 border border-muted">
                                                        Ended
                                                    </div>
                                                );
                                            }
                                            if (event.status === 'ACTIVE' || event.status === 'PUBLISHED') {
                                                return (
                                                    <div className="absolute bottom-3 left-3 bg-gradient-to-r from-accent to-accent-dark text-accent-foreground text-xs px-3 py-1 rounded-full font-bold shadow-lg flex items-center gap-1.5 border border-accent">
                                                        <span className="w-1.5 h-1.5 bg-accent-foreground rounded-full animate-pulse"></span>
                                                        Available
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-card to-background">
                                        <h3 className="font-bold text-foreground text-lg mb-3 line-clamp-1 group-hover:text-primary transition-colors">
                                            {event.name}
                                        </h3>

                                        <div className="space-y-2 mb-4 flex-grow">
                                            <div className="flex items-center text-sm text-primary font-bold">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                <span>{formatDate(event.startDateTime || event.startDate)}</span>
                                            </div>
                                            {event.venue && (
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <MapPin className="w-4 h-4 mr-2 text-primary" />
                                                    <span className="line-clamp-1">{event.venue.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-primary/20 mt-auto">
                                            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                                                <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
                                                <span>{formatLikes(event.likes)}</span>
                                            </div>
                                            <span className="text-primary text-sm font-bold flex items-center group-hover:translate-x-1 transition-transform uppercase tracking-wide">
                                                Details <ChevronRight className="w-4 h-4 ml-0.5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </RoleGuard>
    );
}