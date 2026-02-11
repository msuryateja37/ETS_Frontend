'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, DollarSign, Users, Image, Info, Phone, Mail, Clock, Save, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import RoleGuard from "../components/RoleGuard";

export default function AdminEventForm({ initialData = null, onSubmit }) {
    const { token } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        venueId: '',
        startDateTime: '',
        endDateTime: '',
        status: 'DRAFT',
        category: 'MUSIC',
        seatingType: 'RESERVED',
        currency: 'R',
        zones: [],
        likes: 0,
        ageLimit: '',
        portraitImage: '',
        landscapeImage: '',
        eventContactDetails: {
            coordinatorName: '',
            coordinatorPhone: '',
            coordinatorEmail: '',
            timings: ''
        }
    });

    const [venues, setVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchVenues = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/venue`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setVenues(data.venues || []);
            } catch (error) {
                console.error('Error fetching venues:', error);
            }
        };
        fetchVenues();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                startDateTime: initialData.startDateTime ? new Date(initialData.startDateTime).toISOString().slice(0, 16) : '',
                endDateTime: initialData.endDateTime ? new Date(initialData.endDateTime).toISOString().slice(0, 16) : '',
                venueId: initialData.venueId?._id || initialData.venueId || '',
                eventContactDetails: initialData.eventContactDetails || {
                    coordinatorName: '',
                    coordinatorPhone: '',
                    coordinatorEmail: '',
                    timings: ''
                }
            });
            const venueId = initialData.venueId?._id || initialData.venueId;
            if (venueId && venues.length > 0) {
                const venue = venues.find(v => v._id === venueId);
                setSelectedVenue(venue);
            }
        }
    }, [initialData, venues]);

    useEffect(() => {
        if (formData.venueId && venues.length > 0) {
            const venue = venues.find(v => v._id === formData.venueId);
            setSelectedVenue(venue);
        } else {
            setSelectedVenue(null);
        }
    }, [formData.venueId, venues]);

    const getAlreadySelectedSections = () => {
        const allSelected = new Set();
        formData.zones.forEach(zone => {
            (zone.sections || []).forEach(sectionId => allSelected.add(sectionId));
        });
        return allSelected;
    };

    const getAvailableSectionsForZone = (currentZoneIndex) => {
        if (!selectedVenue) return [];

        const alreadySelected = getAlreadySelectedSections();
        const currentZoneSections = formData.zones[currentZoneIndex]?.sections || [];

        return selectedVenue.sections.filter(section => {
            const sectionId = section.id || section._id;
            return !alreadySelected.has(sectionId) || currentZoneSections.includes(sectionId);
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleZoneChange = (index, field, value) => {
        const newZones = [...formData.zones];
        newZones[index] = { ...newZones[index], [field]: value };
        setFormData({ ...formData, zones: newZones });
    };

    const handleSectionToggle = (zoneIndex, sectionId) => {
        const newZones = [...formData.zones];
        const currentSections = newZones[zoneIndex].sections || [];

        if (currentSections.includes(sectionId)) {
            newZones[zoneIndex].sections = currentSections.filter(id => id !== sectionId);
        } else {
            newZones[zoneIndex].sections = [...currentSections, sectionId];
        }
        setFormData({ ...formData, zones: newZones });
    };

    const addZone = () => {
        setFormData({
            ...formData,
            zones: [...formData.zones, { name: '', price: 0, sections: [] }]
        });
    };

    const removeZone = (index) => {
        const newZones = [...formData.zones];
        newZones.splice(index, 1);
        setFormData({ ...formData, zones: newZones });
    };

    const validateZonesAndSections = () => {
        if (!selectedVenue) {
            alert('Please select a venue');
            return false;
        }

        // Check if zones exist
        if (formData.zones.length === 0) {
            alert('Please add at least one zone');
            return false;
        }

        // Check if all zones have sections assigned
        const zonesWithoutSections = formData.zones.filter(zone => !zone.sections || zone.sections.length === 0);
        if (zonesWithoutSections.length > 0) {
            alert('All zones must have at least one section assigned');
            return false;
        }

        // Check if all sections are assigned
        const allAssignedSections = new Set();
        formData.zones.forEach(zone => {
            (zone.sections || []).forEach(sectionId => allAssignedSections.add(sectionId));
        });

        const totalSections = selectedVenue.sections.length;
        if (allAssignedSections.size !== totalSections) {
            alert(`All sections must be assigned. You have ${totalSections} sections but only assigned ${allAssignedSections.size}`);
            return false;
        }

        // Check for duplicate sections (overlapping zones)
        const sectionCounts = {};
        let hasDuplicates = false;
        formData.zones.forEach(zone => {
            (zone.sections || []).forEach(sectionId => {
                sectionCounts[sectionId] = (sectionCounts[sectionId] || 0) + 1;
                if (sectionCounts[sectionId] > 1) {
                    hasDuplicates = true;
                }
            });
        });

        if (hasDuplicates) {
            alert('Each section can only be assigned to one zone');
            return false;
        }

        // Check if all zones have a name and price
        const invalidZones = formData.zones.filter(zone => !zone.name || zone.price === '' || zone.price === 0);
        if (invalidZones.length > 0) {
            alert('All zones must have a name and price');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate zones and sections before submitting
        if (!validateZonesAndSections()) {
            return;
        }

        setLoading(true);
        await onSubmit(formData);
        setLoading(false);
    };

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Event Details Card */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Info className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Event Details</h2>
                        </div>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Event Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter event name"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Describe your event..."
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <MapPin className="w-4 h-4 inline mr-2" />
                                    Venue *
                                </label>
                                <select
                                    name="venueId"
                                    value={formData.venueId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground"
                                >
                                    <option value="">Select a venue</option>
                                    {venues.map(venue => (
                                        <option key={venue._id} value={venue._id}>
                                            {venue.name} - {venue.city}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground"
                                >
                                    <option value="MUSIC">🎵 Music</option>
                                    <option value="SPORTS">⚽ Sports</option>
                                    <option value="THEATER">🎭 Theater</option>
                                    <option value="COMEDY">😂 Comedy</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Start Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="startDateTime"
                                    value={formData.startDateTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    End Date & Time *
                                </label>
                                <input
                                    type="datetime-local"
                                    name="endDateTime"
                                    value={formData.endDateTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Status *
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground"
                                >
                                    <option value="DRAFT">📝 Draft</option>
                                    <option value="PUBLISHED">✓ Published</option>
                                    <option value="SOLD_OUT">🔥 Sold Out</option>
                                    <option value="CANCELLED">✕ Cancelled</option>
                                    <option value="COMPLETED">★ Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Seating Type *
                                </label>
                                <select
                                    name="seatingType"
                                    value={formData.seatingType}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground"
                                >
                                    <option value="RESERVED">Reserved Seating</option>
                                    <option value="GENERAL">General Admission</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Age Limit
                                </label>
                                <input
                                    type="number"
                                    name="ageLimit"
                                    value={formData.ageLimit}
                                    onChange={handleChange}
                                    placeholder="18"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <DollarSign className="w-4 h-4 inline mr-2" />
                                    Currency *
                                </label>
                                <input
                                    type="text"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleChange}
                                    required
                                    placeholder="R"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Event Images Card */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Image className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Event Images</h2>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Portrait Image URL
                                </label>
                                <input
                                    type="url"
                                    name="portraitImage"
                                    value={formData.portraitImage}
                                    onChange={handleChange}
                                    placeholder="https://example.com/portrait.jpg"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Landscape Image URL
                                </label>
                                <input
                                    type="url"
                                    name="landscapeImage"
                                    value={formData.landscapeImage}
                                    onChange={handleChange}
                                    placeholder="https://example.com/landscape.jpg"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Details Card */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Phone className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Contact Information</h2>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Coordinator Name
                                </label>
                                <input
                                    type="text"
                                    name="eventContactDetails.coordinatorName"
                                    value={formData.eventContactDetails?.coordinatorName}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Mail className="w-4 h-4 inline mr-2" />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    name="eventContactDetails.coordinatorEmail"
                                    value={formData.eventContactDetails?.coordinatorEmail}
                                    onChange={handleChange}
                                    placeholder="coordinator@example.com"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Phone className="w-4 h-4 inline mr-2" />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    name="eventContactDetails.coordinatorPhone"
                                    value={formData.eventContactDetails?.coordinatorPhone}
                                    onChange={handleChange}
                                    placeholder="+1 234 567 8900"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Clock className="w-4 h-4 inline mr-2" />
                                    Timings
                                </label>
                                <input
                                    type="text"
                                    name="eventContactDetails.timings"
                                    value={formData.eventContactDetails?.timings}
                                    onChange={handleChange}
                                    placeholder="9 AM - 5 PM"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Zones & Pricing Card */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6 border-b border-border flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Zones & Pricing</h2>
                        </div>
                        <button
                            type="button"
                            onClick={addZone}
                            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-4 h-4" />
                            Add Zone
                        </button>
                    </div>
                    <div className="p-8 space-y-6">
                        {formData.zones.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                                    <Users className="w-8 h-8 text-primary" />
                                </div>
                                <p className="text-lg font-semibold text-foreground mb-2">No zones configured yet</p>
                                <p className="text-sm text-muted-foreground">Click "Add Zone" to create pricing zones for your event</p>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-foreground">
                                            <p className="font-semibold mb-2">Validation Requirements:</p>
                                            <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                                                <li>Each zone must have at least one section assigned</li>
                                                <li>No section can be assigned to multiple zones</li>
                                                <li>All sections must be assigned to exactly one zone</li>
                                                <li>Each zone must have a name and price</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {formData.zones.map((zone, index) => {
                                    const availableSections = getAvailableSectionsForZone(index);
                                    const selectedCount = zone.sections?.length || 0;
                                    const totalSections = selectedVenue?.sections.length || 0;
                                    const isZoneValid = zone.name && zone.price && selectedCount > 0;

                                    return (
                                        <div key={index} className={`bg-background-elevated p-6 rounded-2xl border-2 transition-all relative group ${isZoneValid
                                                ? 'border-accent/50 hover:border-accent'
                                                : 'border-destructive/30 hover:border-destructive/50'
                                            }`}>
                                            <button
                                                type="button"
                                                onClick={() => removeZone(index)}
                                                className="absolute top-4 right-4 p-2 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground rounded-lg transition-all border border-destructive/20"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>

                                            <div className="mb-6 flex items-center justify-between">
                                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                                                    <span className="text-primary font-bold text-sm">Zone {index + 1}</span>
                                                </div>
                                                {isZoneValid ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold border border-accent/20">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Complete
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-bold border border-destructive/20">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Incomplete
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                <div>
                                                    <label className="block text-sm font-semibold text-foreground mb-3">Zone Name *</label>
                                                    <input
                                                        type="text"
                                                        value={zone.name}
                                                        onChange={(e) => handleZoneChange(index, 'name', e.target.value)}
                                                        placeholder="e.g. VIP, General Admission"
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-semibold text-foreground mb-3">Price ({formData.currency}) *</label>
                                                    <input
                                                        type="number"
                                                        value={zone.price}
                                                        onChange={(e) => handleZoneChange(index, 'price', e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-4">
                                                    Assign Sections
                                                    <div className="mt-2 text-xs font-normal text-muted-foreground">
                                                        Selected: {selectedCount} / Available: {availableSections.length}
                                                    </div>
                                                    {selectedCount > 0 && (
                                                        <span className="ml-3 inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-bold border border-accent/20">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            {selectedCount} selected
                                                        </span>
                                                    )}
                                                </label>
                                                {selectedVenue ? (
                                                    availableSections.length > 0 ? (
                                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                            {availableSections.map(section => {
                                                                const sectionId = section.id || section._id;
                                                                const isSelected = zone.sections?.includes(sectionId);

                                                                return (
                                                                    <label
                                                                        key={sectionId}
                                                                        className={`flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                                                ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                                                                                : 'bg-background border-border text-foreground hover:border-primary/60 hover:bg-primary/5'
                                                                            }`}
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isSelected}
                                                                            onChange={() => handleSectionToggle(index, sectionId)}
                                                                            className="sr-only"
                                                                        />
                                                                        <span className="font-bold text-sm">{section.name}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-12 bg-destructive/10 border-2 border-destructive/20 rounded-xl">
                                                            <p className="text-destructive font-semibold mb-1">⚠️ No sections available</p>
                                                            <p className="text-sm text-destructive/70">All sections have been assigned to other zones</p>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="text-center py-12 bg-primary/10 border-2 border-primary/20 rounded-xl">
                                                        <p className="text-primary font-semibold mb-1">ℹ️ Select a venue first</p>
                                                        <p className="text-sm text-primary/70">Choose a venue to see available sections</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="group flex items-center gap-3 px-10 py-5 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving Event...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Save Event
                            </>
                        )}
                    </button>
                </div>
            </form>
        </RoleGuard>
    );
}