'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Edit2, Calendar, MapPin, DollarSign, Users, Image, Info, Phone, Mail, Clock } from 'lucide-react';
import RoleGuard from '@/app/components/RoleGuard';
import Navbar from '@/app/components/Navbar';

import { useAdminEvent, useEventAssignments } from '@/hooks/useAdmin';

export default function EventDetailsPage({ params }) {
    const { id } = React.use(params);
    const router = useRouter();

    const { data: event, isLoading: eventLoading, isError: eventError } = useAdminEvent(id);
    const { data: assignments = [], isLoading: assignmentsLoading } = useEventAssignments(id);

    const loading = eventLoading || assignmentsLoading;

    if (loading) {
        return (
            <RoleGuard allowedRoles={["ADMIN"]}>
                <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
                        <p className="mt-6 text-foreground font-semibold text-lg">Loading Event...</p>
                    </div>
                </div>
            </RoleGuard>
        );
    }

    if (eventError || !event) {
        return (
            <RoleGuard allowedRoles={["ADMIN"]}>
                <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center gap-4">
                    <p className="text-destructive font-bold text-xl">Event not found or failed to load.</p>
                    <button
                        onClick={() => router.push('/admin/events')}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold"
                    >
                        Back to Events
                    </button>
                </div>
            </RoleGuard>
        );
    }

    if (!event) return null;

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <Navbar />
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/admin/events')}
                                className="group p-3 bg-card border border-border rounded-full text-muted-foreground hover:border-primary/40 hover:text-primary transition-all shadow-sm"
                            >
                                <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                            </button>
                            <div>
                                <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">{event.name}</h1>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${event.status === 'PUBLISHED' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                        event.status === 'DRAFT' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                            'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                        }`}>
                                        {event.status}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-card rounded-full border border-border text-xs font-medium">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(event.startDateTime).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(`/admin/events/${id}/edit`)}
                            className="px-6 py-3 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Event
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Info Column */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Images Section */}
                            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                                <div className="aspect-video relative bg-muted">
                                    {event.images?.landscapeImage || event.images?.portraitImage || event.landscapeImage || event.portraitImage || event.image || event.posterURL ? (
                                        <img
                                            src={event.images?.landscapeImage || event.images?.portraitImage || event.landscapeImage || event.portraitImage || event.image || event.posterURL}
                                            alt="Event Cover"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                            <Image className="w-12 h-12 opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-lg font-mono text-sm border border-white/10">
                                        {event.category}
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                        <Info className="w-5 h-5 text-primary" />
                                        Description
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                        {event.description || 'No description provided.'}
                                    </p>
                                </div>
                            </div>

                            {/* Gate Staff Section */}
                            <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
                                <div className="p-8 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                        <Users className="w-5 h-5 text-primary" />
                                        Assigned Gate Staff ({assignments.length})
                                    </h3>
                                </div>
                                <div className="p-0">
                                    {assignments.length > 0 ? (
                                        <div className="divide-y divide-border">
                                            {assignments.map(assign => (
                                                <div key={assign._id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                            {assign.userId?.name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-foreground">{assign.userId?.name}</div>
                                                            <div className="text-foreground">
                                                                {assign.userId?.phone}
                                                                <span className="text-sm text-foreground"> . {assign.userId?.email}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gate</div>
                                                        <div className="font-mono font-bold text-foreground bg-muted px-3 py-1 rounded-md border border-border">
                                                            {assign.gateName}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-12 text-center text-muted-foreground">
                                            No gate staff assigned to this event.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Info */}
                        <div className="space-y-8">
                            {/* Key Details */}
                            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm space-y-6">
                                <div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Venue</div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-primary mt-1" />
                                        <div>
                                            {event.venueId ? (
                                                <>
                                                    <div className="font-bold text-foreground text-lg">{event.venueId.name}</div>
                                                    <div className="text-sm text-muted-foreground">{event.venueId.city}, {event.venueId.country}</div>
                                                </>
                                            ) : (
                                                <div className="text-muted-foreground">No venue selected</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px bg-border"></div>

                                <div>
                                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Time & Duration</div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-primary" />
                                            <span className="text-foreground">{new Date(event.startDateTime).toLocaleString()}</span>
                                        </div>
                                        <div className="pl-7 text-xs text-muted-foreground">to</div>
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">{new Date(event.endDateTime).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Zones Summary */}
                            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    Zones
                                </h3>
                                <div className="space-y-3">
                                    {event.zones && event.zones.length > 0 ? (
                                        event.zones.map((zone, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border">
                                                <span className="font-medium text-sm">{zone.name}</span>
                                                <span className="font-bold text-primary text-sm">{event.currency} {zone.price}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No zones defined</div>
                                    )}
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="bg-card rounded-3xl border border-border p-6 shadow-sm">
                                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-primary" />
                                    Contact
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Coordinator</div>
                                        <div className="font-medium">{event.eventContactDetails?.coordinatorName || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Phone</div>
                                        <div className="font-medium">{event.eventContactDetails?.coordinatorPhone || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Email</div>
                                        <div className="font-medium text-sm">{event.eventContactDetails?.coordinatorEmail || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </RoleGuard>
    );
}