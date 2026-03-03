'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Edit2, Trash2, MapPin, Calendar as CalendarIcon, Users, Crown, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import RoleGuard from "../../components/RoleGuard";
import Navbar from "../../components/Navbar";
import Footer from "@/app/components/Footer";

export default function AdminEventsPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events?role=ADMIN`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                const uniqueEvents = Array.isArray(data)
                    ? data.filter((event, index, self) =>
                        index === self.findIndex((e) => e._id === event._id)
                    )
                    : [];

                setEvents(uniqueEvents);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleEdit = (id) => {
        router.push(`/admin/events/${id}`);
    };

    const handleDelete = async (id, eventName) => {
        if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setEvents(events.filter(event => event._id !== id));
            } else {
                alert('Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('An error occurred while deleting the event');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            DRAFT: {
                bg: 'bg-muted/50',
                text: 'text-muted-foreground',
                border: 'border-muted/30',
                label: 'Draft',
                icon: '📝'
            },
            PUBLISHED: {
                bg: 'bg-accent/10',
                text: 'text-accent',
                border: 'border-accent/20',
                label: 'Published',
                icon: '✓'
            },
            SOLD_OUT: {
                bg: 'bg-destructive/10',
                text: 'text-destructive',
                border: 'border-destructive/20',
                label: 'Sold Out',
                icon: '🔥'
            },
            CANCELLED: {
                bg: 'bg-destructive/10',
                text: 'text-destructive',
                border: 'border-destructive/20',
                label: 'Cancelled',
                icon: '✕'
            },
            COMPLETED: {
                bg: 'bg-primary/10',
                text: 'text-primary',
                border: 'border-primary/20',
                label: 'Completed',
                icon: '★'
            }
        };

        const config = statusConfig[status] || statusConfig.DRAFT;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
                <span>{config.icon}</span>
                {config.label}
            </span>
        );
    };

    const getCategoryIcon = (category) => {
        const icons = {
            MUSIC: '🎵',
            SPORTS: '⚽',
            THEATER: '🎭',
            COMEDY: '😂'
        };
        return icons[category] || '🎫';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
                    <p className="mt-6 text-foreground font-semibold text-lg">Loading Imperial Events...</p>
                </div>
            </div>
        );
    }

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <div className="min-h-screen bg-background">
                <Navbar />

                <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
                    {/* Luxurious Header */}
                    <div className="mb-12 relative">
                        {/* Decorative top border */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>

                        <div className="py-4">
                            {/* Back Button */}
                            <div className="mb-6">
                                <button
                                    onClick={() => router.back()}
                                    className="group inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full text-muted-foreground font-medium hover:border-primary/40 hover:text-primary transition-all"
                                >
                                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                    <span>Back</span>
                                </button>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-2 flex flex-wrap items-center gap-4">
                                            Event Management
                                            <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-base font-bold border border-primary/20">
                                                {events.length} Total
                                            </span>
                                        </h1>
                                    </div>
                                </div>

                                <button
                                    onClick={() => router.push('/admin/events/create')}
                                    className="group flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Add New Event
                                </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>                        </div>

                        {/* Decorative bottom border */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                    </div>

                    {/* Events Grid */}
                    {events.length === 0 ? (
                        <div className="bg-card rounded-3xl border border-border p-16 text-center relative overflow-hidden">
                            {/* Subtle background pattern */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                                    backgroundSize: '40px 40px'
                                }}></div>
                            </div>

                            <div className="relative z-10">
                                <div className="mb-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border border-primary/20">
                                    <Sparkles className="w-12 h-12 text-primary" />
                                </div>
                                <h2 className="text-3xl font-bold text-foreground mb-3">No Events Yet</h2>
                                <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                                    Begin your journey by creating your first premier event
                                </p>
                                <button
                                    onClick={() => router.push('/admin/events/create')}
                                    className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Plus className="w-5 h-5" />
                                    Create Event
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {events.map((event, index) => (
                                <div
                                    key={`${event._id}-${index}`}
                                    className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 transition-all flex flex-col relative"
                                >
                                    {/* Image Section */}
                                    {event.portraitImage || event.landscapeImage || event.image || event.posterURL ? (
                                        <div className="relative h-56 overflow-hidden bg-background-elevated">
                                            <img
                                                src={event.landscapeImage || event.image || event.posterURL}
                                                alt={event.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                            {/* Gradient overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent"></div>

                                            {/* Status badge overlay */}
                                            <div className="absolute top-4 right-4">
                                                {getStatusBadge(event.status)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-56 bg-gradient-to-br from-primary/10 via-background-elevated to-background-elevated flex items-center justify-center text-7xl border-b border-border relative">
                                            {getCategoryIcon(event.category)}
                                            <div className="absolute top-4 right-4">
                                                {getStatusBadge(event.status)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Content Section */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h2 className="text-xl font-bold text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                                            {event.name}
                                        </h2>

                                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                                            {event.description || 'No description provided'}
                                        </p>

                                        {/* Event Details */}
                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="text-muted-foreground truncate flex-1">
                                                    {event.venueId?.name || 'Venue TBD'}
                                                    {event.venueId?.city && ` • ${event.venueId.city}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm">
                                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                                </div>
                                                <span className="text-muted-foreground truncate flex-1">
                                                    {formatDate(event.startDateTime)}
                                                </span>
                                            </div>
                                            {event.zones && event.zones.length > 0 && (
                                                <div className="flex items-center gap-3 text-sm">
                                                    <div className="p-1.5 bg-primary/10 rounded-lg">
                                                        <Users className="w-4 h-4 text-primary" />
                                                    </div>
                                                    <span className="text-muted-foreground">
                                                        {event.zones.length} zone{event.zones.length !== 1 ? 's' : ''} configured
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 mt-auto pt-4 border-t border-border-light">
                                            <button
                                                onClick={() => handleEdit(event._id)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground rounded-xl font-semibold transition-all border border-primary/20"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(event._id, event.name)}
                                                className="flex items-center justify-center px-4 py-3 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground rounded-xl font-semibold transition-all border border-destructive/20"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Hover effect border */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <Footer />
            </div>
        </RoleGuard>
    );
}