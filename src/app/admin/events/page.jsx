'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Edit2, Trash2, MapPin, Calendar as CalendarIcon, Users, Crown, Sparkles, ArrowRight, ArrowLeft, Search, Filter, ChevronDown, X, UsersIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import RoleGuard from "../../components/RoleGuard";
import Navbar from "../../components/Navbar";
import Footer from "@/app/components/Footer";

export default function AdminEventsPage() {
    const [events, setEvents] = useState([]);
    const [filteredEvents, setFilteredEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('default');
    const { token, loading: authLoading } = useAuth();
    const router = useRouter();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 8;

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
        if (!authLoading && token) {
            fetchEvents();
        }
    }, [authLoading, token]);

    useEffect(() => {
        let result = [...events];

        // Search filter (including month/date)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const monthNames = ["january", "february", "march", "april", "may", "june",
                "july", "august", "september", "october", "november", "december"];
            const shortMonths = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

            result = result.filter(event => {
                const eventDate = new Date(event.startDateTime);
                const eventMonth = monthNames[eventDate.getMonth()];
                const eventShortMonth = shortMonths[eventDate.getMonth()];
                const eventDay = eventDate.getDate().toString();
                const eventYear = eventDate.getFullYear().toString();

                return (
                    event.name?.toLowerCase().includes(query) ||
                    event.venueId?.name?.toLowerCase().includes(query) ||
                    event.venueId?.city?.toLowerCase().includes(query) ||
                    eventMonth.includes(query) ||
                    eventShortMonth.includes(query) ||
                    eventDay === query ||
                    eventYear === query
                );
            });
        }

        // Category filter
        if (categoryFilter !== 'ALL') {
            result = result.filter(event => event.category === categoryFilter);
        }

        // Status filter
        if (statusFilter !== 'ALL') {
            result = result.filter(event => event.status === statusFilter);
        }

        // Sorting
        result.sort((a, b) => {
            if (sortBy === 'default') {
                const now = new Date();
                const isAUpcoming = a.status === 'PUBLISHED' && new Date(a.endDateTime) >= now;
                const isBUpcoming = b.status === 'PUBLISHED' && new Date(b.endDateTime) >= now;

                if (isAUpcoming && !isBUpcoming) return -1;
                if (!isAUpcoming && isBUpcoming) return 1;

                if (isAUpcoming && isBUpcoming) {
                    return new Date(a.startDateTime) - new Date(b.startDateTime); // Closest first
                }

                // Both are not upcoming - group by status and then DESC date
                const statusPriority = {
                    COMPLETED: 1,
                    SOLD_OUT: 2,
                    DRAFT: 3,
                    CANCELLED: 4
                };

                const priorityA = statusPriority[a.status] || 5;
                const priorityB = statusPriority[b.status] || 5;

                if (priorityA !== priorityB) {
                    return priorityA - priorityB;
                }

                const dateA = a.status === 'DRAFT' ? new Date(a.createdAt) : new Date(a.endDateTime || a.startDateTime);
                const dateB = b.status === 'DRAFT' ? new Date(b.createdAt) : new Date(b.endDateTime || b.startDateTime);
                return dateB - dateA;
            }

            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.startDateTime) - new Date(b.startDateTime);
                case 'date-desc':
                    return new Date(b.startDateTime) - new Date(a.startDateTime);
                case 'name-asc':
                    return (a.name || '').localeCompare(b.name || '');
                case 'name-desc':
                    return (b.name || '').localeCompare(a.name || '');
                default:
                    return 0;
            }
        });

        setFilteredEvents(result);
        setCurrentPage(1); // Reset to first page when filtering/sorting changes
    }, [events, searchQuery, statusFilter, categoryFilter, sortBy]);

    // Get current events (pagination logic)
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        const sectionHeader = document.getElementById('events-registry-header');
        if (sectionHeader) {
            sectionHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) handlePageChange(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) handlePageChange(currentPage + 1);
    };

    const getPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }
        return pages;
    };

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

    const eventStatuses = [
        { id: 'ALL', label: 'All Events' },
        { id: 'PUBLISHED', label: 'Published' },
        { id: 'DRAFT', label: 'Draft' },
        { id: 'COMPLETED', label: 'Completed' },
        { id: 'SOLD_OUT', label: 'Sold Out' },
        { id: 'CANCELLED', label: 'Cancelled' }
    ];

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
                                    <h1 id="events-registry-header" className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-2 flex flex-wrap items-center gap-4">
                                        Event Mangement
                                        <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-base font-bold border border-primary/20">
                                            {events.length} Total
                                        </span>
                                    </h1>
                                </div>

                                <button
                                    onClick={() => router.push('/admin/events/create')}
                                    className="group flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                >
                                    <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    Create Event
                                </button>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
                    </div>

                    {/* Search & Filters */}
                    <div className="bg-card rounded-2xl border border-border p-6 mb-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Search */}
                                <div className="flex-1 relative group">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search by name, venue, month, or year..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-12 py-4 bg-background-elevated border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground placeholder:text-muted-foreground"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            <X className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    )}
                                </div>

                                {/* Category Dropdown */}
                                <div className="relative min-w-[180px]">
                                    <Edit2 className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="w-full pl-12 pr-10 py-4 bg-background-elevated border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-all font-bold text-foreground appearance-none cursor-pointer text-sm"
                                    >
                                        <option value="ALL">All Categories</option>
                                        <option value="MUSIC">Music</option>
                                        <option value="SPORTS">Sports</option>
                                        <option value="THEATER">Theater</option>
                                        <option value="COMEDY">Comedy</option>
                                        <option value="WORKSHOP">Workshop</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                                </div>

                                {/* Sort Dropdown */}
                                <div className="relative min-w-[200px]">
                                    <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full pl-12 pr-10 py-4 bg-background-elevated border-2 border-border rounded-xl focus:outline-none focus:border-primary transition-all font-bold text-foreground appearance-none cursor-pointer"
                                    >
                                        <option value="default">Default Sort</option>
                                        <option value="date-desc">Newest First</option>
                                        <option value="date-asc">Oldest First</option>
                                        <option value="name-asc">Name (A-Z)</option>
                                        <option value="name-desc">Name (Z-A)</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                                </div>

                                {/* Clear Filters */}
                                {(searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || sortBy !== 'default') && (
                                    <button
                                        onClick={() => {
                                            setSearchQuery("");
                                            setStatusFilter("ALL");
                                            setCategoryFilter("ALL");
                                            setSortBy("default");
                                        }}
                                        className="px-6 py-4 bg-primary/10 text-primary border-2 border-primary/20 rounded-xl font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear All
                                    </button>
                                )}
                            </div>

                            {/* Status Tabs with Counts */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                {eventStatuses.map(tab => {
                                    const count = tab.id === 'ALL'
                                        ? events.length
                                        : events.filter(e => e.status === tab.id).length;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setStatusFilter(tab.id)}
                                            className={`group relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-2 ${statusFilter === tab.id
                                                ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                                                : 'bg-background-elevated border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5'
                                                }`}
                                        >
                                            {tab.label}
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${statusFilter === tab.id
                                                ? 'bg-background/20 text-background'
                                                : 'bg-primary/10 text-primary group-hover:bg-primary/20'
                                                }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Events List */}
                    {filteredEvents.length === 0 ? (
                        <div className="bg-card rounded-3xl border border-border p-12 md:p-20 text-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-50"></div>
                            <div className="relative z-10 max-w-md mx-auto">
                                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <Sparkles className="w-12 h-12 text-primary animate-pulse" />
                                </div>
                                <h3 className="text-3xl font-black text-foreground mb-4">No Events Found</h3>
                                <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                                    {searchQuery || statusFilter !== 'ALL'
                                        ? "Your search parameters didn't yield any results in our current registry."
                                        : "The event registry is currently empty. Begin by creating your first masterpiece."}
                                </p>
                                {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? (
                                    <button
                                        onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); setCategoryFilter('ALL'); setSortBy('default'); }}
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 rounded-xl font-bold transition-all"
                                    >
                                        Clear All Filters
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => router.push('/admin/events/create')}
                                        className="inline-flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create Event
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {currentEvents.map((event, index) => (
                                    <div
                                        key={`${event._id}-${index}`}
                                        className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/40 transition-all flex flex-col relative shadow-sm hover:shadow-xl hover:-translate-y-1 duration-300"
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
                                                            <UsersIcon className="w-4 h-4 text-primary" />
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

                            {/* Pagination UI */}
                            {totalPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card rounded-2xl p-6 border border-border shadow-lg">
                                    <div className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                                        Showing {indexOfFirstEvent + 1} - {Math.min(indexOfLastEvent, filteredEvents.length)} of {filteredEvents.length} Events
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handlePreviousPage}
                                            disabled={currentPage === 1}
                                            className={`p-2.5 rounded-xl transition-all border-2 ${currentPage === 1
                                                ? 'border-border text-muted-foreground/30 cursor-not-allowed'
                                                : 'border-border text-primary hover:bg-primary/10 hover:border-primary/40 active:scale-90'
                                                }`}
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>

                                        <div className="hidden sm:flex items-center gap-1">
                                            {getPageNumbers().map((pageNum, index) => (
                                                pageNum === '...' ? (
                                                    <span key={`ellipsis-${index}`} className="px-3 text-muted-foreground/50">...</span>
                                                ) : (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`w-11 h-11 rounded-xl text-sm font-black transition-all border-2 ${currentPage === pageNum
                                                            ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                                                            : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5'
                                                            }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )
                                            ))}
                                        </div>

                                        <button
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                            className={`p-2.5 rounded-xl transition-all border-2 ${currentPage === totalPages
                                                ? 'border-border text-muted-foreground/30 cursor-not-allowed'
                                                : 'border-border text-primary hover:bg-primary/10 hover:border-primary/40 active:scale-90'
                                                }`}
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
                <Footer />
            </div>
        </RoleGuard>
    );
}