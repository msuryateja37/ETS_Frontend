'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { useEvents, useDeleteEvent } from '../../../hooks/useAdmin';
import { Plus, Edit2, Trash2, MapPin, Calendar as CalendarIcon, Users, Crown, Sparkles, ArrowRight, ArrowLeft, Search, Filter, ChevronDown, X, UsersIcon, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import RoleGuard from "../../components/RoleGuard";
import Navbar from "../../components/Navbar";
import Footer from "@/app/components/Footer";
import DeleteConfirmationDialog from "../../components/DeleteConfirmationDialog";
import { formatDate } from "@/app/utils/dateUtils";

export default function AdminEventsPage() {
    const { token } = useAuth();
    const router = useRouter();

    const { data: eventsData = [], isLoading, isError } = useEvents();
    const deleteEventMutation = useDeleteEvent();

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [sortBy, setSortBy] = useState('default');

    // Delete confirmation state
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 8;

    // Reset to first page when filtering/sorting changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, categoryFilter, sortBy]);

    const filteredEvents = useMemo(() => {
        let result = [...eventsData];

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
                    eventMonth?.includes(query) ||
                    eventShortMonth?.includes(query) ||
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

        return result;
    }, [eventsData, searchQuery, statusFilter, categoryFilter, sortBy]);

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

    const handleView = (id) => {
        router.push(`/admin/events/${id}`);
    };

    const handleOpenDeleteDialog = (event) => {
        setSelectedEvent(event);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedEvent) return;

        try {
            await deleteEventMutation.mutateAsync(selectedEvent._id);
            setShowDeleteDialog(false);
            setSelectedEvent(null);
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('An error occurred while deleting the event');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            DRAFT: {
                bg: 'bg-muted/80',
                text: 'text-muted-foreground',
                border: 'border-muted/30',
                label: 'Draft',
                icon: '📝'
            },
            PUBLISHED: {
                bg: 'bg-background/80',
                text: 'text-accent',
                border: 'border-accent/20',
                label: 'Published',
                icon: '✓'
            },
            SOLD_OUT: {
                bg: 'bg-background/80',
                text: 'text-destructive',
                border: 'border-destructive/20',
                label: 'Sold Out',
                icon: '🔥'
            },
            CANCELLED: {
                bg: 'bg-background/80',
                text: 'text-destructive',
                border: 'border-destructive/20',
                label: 'Cancelled',
                icon: '✕'
            },
            COMPLETED: {
                bg: 'bg-background/80',
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


    if (isLoading && eventsData.length === 0) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
                    <p className="mt-6 text-foreground font-semibold text-lg">Loading Events Registry...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                <div className="text-center text-red-500 font-bold">
                    Error loading events. Please try again later.
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
                                        Event Management
                                        <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-base font-bold border border-primary/20">
                                            {eventsData.length} Total
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
                                        <option value="CASINO">Casino</option>
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
                                        ? eventsData.length
                                        : eventsData.filter(e => e.status === tab.id).length;

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
                                        className="group bg-card/40 backdrop-blur-xl rounded-3xl border border-border/30 overflow-hidden hover:border-primary/50 transition-all duration-500 flex flex-col relative shadow-2xl hover:shadow-primary/10 hover:-translate-y-2"
                                    >
                                        {/* Image Section with Glassy Overlay */}
                                        <div className="relative h-64 overflow-hidden">
                                            {event.images?.portraitImage || event.images?.landscapeImage || event.portraitImage || event.landscapeImage || event.image || event.posterURL ? (
                                                <img
                                                    src={event.images?.landscapeImage || event.images?.portraitImage || event.landscapeImage || event.portraitImage || event.image || event.posterURL}
                                                    alt={event.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-background-elevated to-background flex items-center justify-center text-8xl">
                                                    {getCategoryIcon(event.category)}
                                                </div>
                                            )}

                                            {/* Gradient & Glass Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80 hover:cursor-pointer"
                                                onClick={() => handleView(event._id)}></div>

                                            {/* Status Badge - Floating Style */}
                                            <div className="absolute top-6 right-6 transform group-hover:scale-110 transition-transform duration-300">
                                                {getStatusBadge(event.status)}
                                            </div>

                                            {/* Quick Info Overlay */}
                                            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between text-white/90">
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-xs font-bold">
                                                    <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                                                    {formatDate(event.startDateTime, { month: 'short', day: 'numeric', year: undefined })}
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-xs font-bold">
                                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                                    {event.venueId?.name + ', ' + event.venueId?.city || 'TBD'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Section - Premium Spacing */}
                                        <div className="p-8 flex-1 flex flex-col relative">
                                            {/* Category Tag */}
                                            <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-3">
                                                {event.category || 'General'}
                                            </div>

                                            <h2 className="text-2xl font-black text-foreground mb-4 line-clamp-1 group-hover:text-primary transition-colors duration-300">
                                                {event.name}
                                            </h2>

                                            <p className="text-muted-foreground text-sm mb-8 line-clamp-2 leading-relaxed flex-1">
                                                {event.description || 'Join us for an unforgettable experience at our world-class venue.'}
                                            </p>

                                            {/* Action Row - Zones, Edit, Delete Side by Side */}
                                            <div className="flex items-center gap-3 mt-auto">
                                                {/* Zones Count */}
                                                <div className="flex-1 flex flex-col items-center justify-center p-3 bg-primary/5 rounded-2xl border border-primary/10 min-h-[64px]">
                                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-tight mb-0.5">Zones</p>
                                                    <p className="text-base font-black text-foreground leading-none">{event.zones?.length || 0}</p>
                                                </div>

                                                {/* Edit Button */}
                                                <button
                                                    onClick={() => handleView(event._id)}
                                                    className="flex-[2] flex items-center justify-center gap-2 px-4 py-4 bg-primary hover:bg-primary-dark text-primary-foreground rounded-2xl font-black transition-all shadow-lg hover:shadow-primary/20 group/btn min-h-[64px]"
                                                >
                                                    <Eye className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
                                                    View
                                                </button>

                                                {/* Delete Button */}
                                                <button
                                                    onClick={() => handleOpenDeleteDialog(event)}
                                                    className="flex-1 flex items-center justify-center bg-card-elevated hover:bg-destructive text-muted-foreground hover:text-white rounded-2xl border border-border/50 hover:border-destructive transition-all duration-300 min-h-[64px]"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Luxury Corner Accent */}
                                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={showDeleteDialog}
                onClose={() => { setShowDeleteDialog(false); setSelectedEvent(null); }}
                onConfirm={handleConfirmDelete}
                title="Cancel & Remove Event"
                message="Are you sure you want to remove this event from the Event Go? This will cancel all associated bookings and cannot be undone."
                itemName={selectedEvent?.name}
                loading={deleteEventMutation.isPending}
            />
        </RoleGuard>
    );
}