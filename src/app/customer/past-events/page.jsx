"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, memo, useMemo } from "react";
import { Calendar, MapPin, Heart, ChevronRight, Crown, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "@/context/AuthContext";
import { formatLikes } from "../../utils/formatLikes";
import { formatDate } from "../../utils/dateUtils";

export default function PastEventsPage() {
    const { user, token } = useAuth();
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [likedEvents, setLikedEvents] = useState(new Set());
    const [likingInProgress, setLikingInProgress] = useState(new Set());
    const [customerId, setCustomerId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchPastEvents();
        if (user && token) {
            fetchCustomerData();
        }
    }, [user, token]);

    const fetchPastEvents = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events?timeframe=past`);
            if (!response.ok) {
                throw new Error('Failed to fetch past events');
            }

            const data = await response.json();
            // Sort events by date in descending order (latest first)
            const sortedEvents = (data || []).sort((a, b) =>
                new Date(b.startDateTime) - new Date(a.startDateTime)
            );
            setEvents(sortedEvents);
        } catch (err) {
            console.error('Error fetching past events:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerData = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/user/${user._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const customerData = await response.json();
                setCustomerId(customerData._id);
                const likedEventIds = new Set(customerData.likedEvents?.map(id => id.toString()) || []);
                setLikedEvents(likedEventIds);
            }
        } catch (err) {
            console.error('Error fetching customer data:', err);
        }
    };

    const handleLikeToggle = async (eventId, e) => {
        e.stopPropagation();
        if (!user || !customerId || likingInProgress.has(eventId)) return;

        try {
            setLikingInProgress(prev => new Set([...prev, eventId]));
            const isLiked = likedEvents.has(eventId);
            const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/${customerId}/like-event`;
            const method = isLiked ? 'DELETE' : 'POST';

            const response = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ eventId: eventId })
            });

            if (response.ok) {
                setLikedEvents(prev => {
                    const newSet = new Set(prev);
                    if (isLiked) newSet.delete(eventId);
                    else newSet.add(eventId);
                    return newSet;
                });

                setEvents(prevEvents =>
                    prevEvents.map(event =>
                        event._id === eventId
                            ? { ...event, likes: (event.likes || 0) + (isLiked ? -1 : 1) }
                            : event
                    )
                );
            }
        } catch (err) {
            console.error('Error toggling like:', err);
        } finally {
            setLikingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(eventId);
                return newSet;
            });
        }
    };


    const filteredEvents = events.filter(event => {
        const searchLower = searchQuery.toLowerCase();
        const dateStr = formatDate(event.startDateTime || event.startDate).toLowerCase();
        return (
            event.name?.toLowerCase().includes(searchLower) ||
            event.category?.toLowerCase().includes(searchLower) ||
            (event.venueId?.name || event.venue?.name)?.toLowerCase().includes(searchLower) ||
            dateStr.includes(searchLower)
        );
    });

    const handleEventClick = (eventId) => {
        router.push(`/events/${eventId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-primary font-semibold tracking-wide">Loading Past Events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar
                showSearch={true}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <main className="flex-grow min-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

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
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-primary">
                            <Calendar className="w-8 h-8 text-primary-foreground fill-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light tracking-tight uppercase">
                                Past Events
                            </h1>
                            <p className="text-muted-foreground mt-4 text-lg">
                                {filteredEvents.length === 0 && searchQuery
                                    ? "No matching memories found"
                                    : "Relive the memories from our previous experiences."
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {events.length > 0 ? (
                    filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredEvents.map((event) => (
                                <EventCard
                                    key={event._id}
                                    event={event}
                                    onClick={() => handleEventClick(event._id)}
                                    onLike={(e) => handleLikeToggle(event._id, e)}
                                    isLiked={likedEvents.has(event._id)}
                                    isLiking={likingInProgress.has(event._id)}
                                    formatDate={formatDate}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-24 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Calendar className="w-10 h-10 text-primary/40" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">No matching events</h2>
                            <p className="text-muted-foreground mb-8">We couldn't find any sessions matching your search.</p>
                            <button
                                onClick={() => setSearchQuery("")}
                                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary-light transition-all"
                            >
                                Clear Search
                            </button>
                        </div>
                    )
                ) : (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar className="w-10 h-10 text-primary/40" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">No past events yet</h2>
                        <p className="text-muted-foreground">Keep checking back for more amazing experiences!</p>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}

// Event Card Component (Reused from HomePage style)
const EventCard = memo(({ event, onClick, onLike, isLiked, isLiking, formatDate }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    const eventImageUrl = useMemo(() => {
        if (!event) return '';
        return event.landscapeImage ||
            event.portraitImage ||
            (event.images && event.images.landscape) ||
            `https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500&auto=format&fit=crop&q=60`;
    }, [event]);

    return (
        <div
            onClick={onClick}
            className="group bg-card rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col h-full grayscale hover:grayscale-0"
        >
            <div className="relative aspect-[3/2] overflow-hidden bg-background">
                {!isLoaded && (
                    <div className="absolute inset-0 bg-card animate-pulse flex items-center justify-center">
                        <Crown className="w-8 h-8 text-primary/30" />
                    </div>
                )}

                <img
                    src={eventImageUrl}
                    alt={event.name}
                    className={`w-full h-full object-cover transition-all duration-500 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} group-hover:scale-110`}
                    onLoad={() => setIsLoaded(true)}
                    loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent opacity-70" />

                <div className="absolute top-3 right-3">
                    <button
                        onClick={onLike}
                        disabled={isLiking}
                        className={`p-2 rounded-full backdrop-blur-md transition-all duration-200 ${isLiked
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background/60 text-primary hover:text-primary-light border border-primary/50'
                            }`}
                    >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    </button>
                </div>

                <div className="absolute bottom-3 left-3 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full border border-primary/30">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">COMPLETED</span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-bold text-foreground text-lg mb-3 line-clamp-1 group-hover:text-primary transition-colors duration-200 uppercase italic">
                    {event.name}
                </h3>

                <div className="space-y-2 mb-4 flex-grow">
                    <div className="flex items-center text-sm text-muted-foreground font-medium">
                        <Calendar className="w-4 h-4 mr-2 text-primary" />
                        <span>{formatDate(event.startDateTime)}</span>
                    </div>
                    {(event.venueId?.name || event.venue?.name) && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 mr-2 text-primary" />
                            <span className="line-clamp-1">{event.venueId?.name || event.venue.name}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-primary/10 mt-auto">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                        <Heart className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span>{formatLikes(event.likes || 0)}</span>
                    </div>
                    <span className="text-primary text-xs font-black flex items-center group-hover:translate-x-1 transition-transform duration-200 uppercase tracking-widest">
                        RELIVE <ChevronRight className="w-4 h-4 ml-0.5" />
                    </span>
                </div>
            </div>
        </div>
    );
});