'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, MapPin, DollarSign, Users, Image, Info, Phone, Mail, Clock, Save, Plus, X, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import RoleGuard from "../components/RoleGuard";

// Removed MOCK_GATE_STAFF

import { useVenues, useGateStaff } from '../../hooks/useAdmin';

export default function AdminEventForm({ initialData = null, onSubmit, isSubmitting = false }) {
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

    const { data: venues = [] } = useVenues();
    const { data: gateStaffList = [] } = useGateStaff();
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [loading, setLoading] = useState(false);

    // Gate Staff State
    const [selectedStaffIds, setSelectedStaffIds] = useState([]); // IDs of staff selected in dropdown
    const [isStaffDropdownOpen, setIsStaffDropdownOpen] = useState(false);
    const [assignedStaff, setAssignedStaff] = useState([]); // Array of staff objects with gateName

    // Local file state for optional image uploads
    const [portraitImageFile, setPortraitImageFile] = useState(null);
    const [landscapeImageFile, setLandscapeImageFile] = useState(null);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                venueId: initialData.venueId?._id || initialData.venueId || '',
                startDateTime: initialData.startDateTime ? new Date(initialData.startDateTime).toISOString().slice(0, 16) : '',
                endDateTime: initialData.endDateTime ? new Date(initialData.endDateTime).toISOString().slice(0, 16) : '',
                status: initialData.status || 'DRAFT',
                category: initialData.category || 'MUSIC',
                seatingType: initialData.seatingType || 'RESERVED',
                currency: initialData.currency || 'R',
                zones: initialData.zones || [],
                likes: initialData.likes || 0,
                ageLimit: initialData.ageLimit || '',
                // Existing events store URLs under images subdocument
                portraitImage: initialData.images?.portraitImage || initialData.portraitImage || '',
                landscapeImage: initialData.images?.landscapeImage || initialData.landscapeImage || '',
                eventContactDetails: {
                    coordinatorName: initialData.eventContactDetails?.coordinatorName || '',
                    coordinatorPhone: initialData.eventContactDetails?.coordinatorPhone || '',
                    coordinatorEmail: initialData.eventContactDetails?.coordinatorEmail || '',
                    timings: initialData.eventContactDetails?.timings || ''
                }
            });
            // Initialize assigned staff if available in initialData
            setAssignedStaff(initialData.gateStaff || []);
            const venueId = initialData.venueId?._id || initialData.venueId;
            if (venueId && venues.length > 0) {
                const venue = venues.find(v => v._id === venueId);
                setSelectedVenue(venue);
            }
        }
        // Reset local file selections when initial data changes
        setPortraitImageFile(null);
        setLandscapeImageFile(null);
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

    const getUserId = (userOrId) => {
        if (!userOrId) return null;
        return typeof userOrId === 'object' ? userOrId._id : userOrId;
    };

    const handleAddStaff = () => {
        if (selectedStaffIds.length === 0) return;

        // Find the staff objects from the IDs
        const newStaff = gateStaffList.filter(s => selectedStaffIds.includes(s._id));

        // Filter out any that might have been added concurrently
        const uniqueNewStaff = newStaff.filter(s => {
            const sUserId = getUserId(s.userId);
            return !assignedStaff.some(assigned => getUserId(assigned.userId) === sUserId);
        });

        if (uniqueNewStaff.length > 0) {
            // Add new staff with empty gateName
            const newAssignments = uniqueNewStaff.map(s => ({
                ...s,
                gateName: ''
            }));

            setAssignedStaff([...assignedStaff, ...newAssignments]);
            setSelectedStaffIds([]);
            setIsStaffDropdownOpen(false);
        }
    };

    const toggleStaffSelection = (staff) => {
        const staffId = staff._id;
        setSelectedStaffIds(prev =>
            prev.includes(staffId)
                ? prev.filter(id => id !== staffId)
                : [...prev, staffId]
        );
    };

    const handleRemoveStaff = (staffId) => {
        setAssignedStaff(assignedStaff.filter(s => s._id !== staffId));
    };

    const handleGateNameChange = (index, value) => {
        const newAssignedStaff = [...assignedStaff];
        newAssignedStaff[index] = { ...newAssignedStaff[index], gateName: value };
        setAssignedStaff(newAssignedStaff);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic date/time validation
        if (!formData.startDateTime || !formData.endDateTime) {
            alert('Please select both start and end date & time.');
            return;
        }

        const start = new Date(formData.startDateTime);
        const end = new Date(formData.endDateTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            alert('Please provide valid start and end date & time values.');
            return;
        }

        if (end <= start) {
            alert('End date & time must be after the start date & time.');
            return;
        }

        // Validate zones and sections before submitting
        if (!validateZonesAndSections()) {
            return;
        }

        // Validate gate staff assignments
        const invalidStaff = assignedStaff.filter(s => !s.gateName || s.gateName.trim() === '');
        if (invalidStaff.length > 0) {
            alert('Please enter a Gate Name for all assigned staff members');
            return;
        }

        setLoading(true);
        // Include assignedStaff and selected image files in the submitted data
        await onSubmit({
            ...formData,
            gateStaff: assignedStaff,
            portraitImageFile,
            landscapeImageFile,
        });
        setLoading(false);
    };

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <form onSubmit={handleSubmit} className="space-y-8 max-w-7xl mx-auto">
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
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        name="startDateTime"
                                        value={formData.startDateTime ? formData.startDateTime.slice(0, 10) : ''}
                                        onChange={(e) => {
                                            const time = formData.startDateTime ? formData.startDateTime.slice(11, 16) : '00:00';
                                            handleChange({ target: { name: 'startDateTime', value: e.target.value ? `${e.target.value}T${time}` : '' } });
                                        }}
                                        required
                                        min={new Date().toISOString().slice(0, 10)}
                                        className="flex-1 px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground [color-scheme:dark]"
                                    />
                                    <input
                                        type="time"
                                        value={formData.startDateTime ? formData.startDateTime.slice(11, 16) : ''}
                                        onChange={(e) => {
                                            const date = formData.startDateTime ? formData.startDateTime.slice(0, 10) : new Date().toISOString().slice(0, 10);
                                            handleChange({ target: { name: 'startDateTime', value: e.target.value ? `${date}T${e.target.value}` : '' } });
                                        }}
                                        min={
                                            formData.startDateTime && formData.startDateTime.slice(0, 10) === new Date().toISOString().slice(0, 10)
                                                ? new Date().toTimeString().slice(0, 5)
                                                : undefined
                                        }
                                        className="w-36 px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    End Date & Time *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        name="endDateTime"
                                        value={formData.endDateTime ? formData.endDateTime.slice(0, 10) : ''}
                                        onChange={(e) => {
                                            const time = formData.endDateTime ? formData.endDateTime.slice(11, 16) : '00:00';
                                            handleChange({ target: { name: 'endDateTime', value: e.target.value ? `${e.target.value}T${time}` : '' } });
                                        }}
                                        required
                                        min={
                                            formData.startDateTime
                                                ? formData.startDateTime.slice(0, 10)
                                                : new Date().toISOString().slice(0, 10)
                                        }
                                        className="flex-1 px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground [color-scheme:dark]"
                                    />
                                    <input
                                        type="time"
                                        value={formData.endDateTime ? formData.endDateTime.slice(11, 16) : ''}
                                        onChange={(e) => {
                                            const date = formData.endDateTime ? formData.endDateTime.slice(0, 10) : new Date().toISOString().slice(0, 10);
                                            handleChange({ target: { name: 'endDateTime', value: e.target.value ? `${date}T${e.target.value}` : '' } });
                                        }}
                                        min={
                                            formData.endDateTime && formData.startDateTime &&
                                            formData.endDateTime.slice(0, 10) === formData.startDateTime.slice(0, 10)
                                                ? formData.startDateTime.slice(11, 16)
                                                : undefined
                                        }
                                        className="w-36 px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground [color-scheme:dark]"
                                    />
                                </div>
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
                                    Portrait Image
                                </label>
                                <div className="space-y-3">
                                    <input
                                        type="url"
                                        name="portraitImage"
                                        value={formData.portraitImage}
                                        onChange={handleChange}
                                        placeholder="https://example.com/portrait.jpg"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        You can either paste an existing image URL above or upload a new image file below.
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setPortraitImageFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                    {portraitImageFile && (
                                        <p className="text-xs text-foreground">
                                            Selected file: <span className="font-medium">{portraitImageFile.name}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-3">
                                    Landscape Image
                                </label>
                                <div className="space-y-3">
                                    <input
                                        type="url"
                                        name="landscapeImage"
                                        value={formData.landscapeImage}
                                        onChange={handleChange}
                                        placeholder="https://example.com/landscape.jpg"
                                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground placeholder:text-muted-foreground"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        You can either paste an existing image URL above or upload a new image file below.
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setLandscapeImageFile(e.target.files?.[0] || null)}
                                        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                    {landscapeImageFile && (
                                        <p className="text-xs text-foreground">
                                            Selected file: <span className="font-medium">{landscapeImageFile.name}</span>
                                        </p>
                                    )}
                                </div>
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

                {/* Gate Staff Management Card */}
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-8 py-6 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold text-foreground">Gate Staff Management</h2>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                                Add Staff Members
                            </label>
                            <div className="flex gap-4 items-start">
                                <div className="relative flex-grow">
                                    <button
                                        type="button"
                                        onClick={() => setIsStaffDropdownOpen(!isStaffDropdownOpen)}
                                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background-elevated focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-foreground text-left flex justify-between items-center"
                                    >
                                        <span className={selectedStaffIds.length === 0 ? "text-muted-foreground" : ""}>
                                            {selectedStaffIds.length === 0
                                                ? "Select staff members..."
                                                : `${selectedStaffIds.length} members selected`}
                                        </span>
                                        <div className={`transition-transform duration-200 ${isStaffDropdownOpen ? "rotate-180" : ""}`}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 opacity-50"><path d="m6 9 6 6 6-6" /></svg>
                                        </div>
                                    </button>

                                    {isStaffDropdownOpen && (
                                        <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="max-h-60 overflow-y-auto">
                                                {gateStaffList.filter(s => {
                                                    const sUserId = getUserId(s.userId);
                                                    return !assignedStaff.some(assigned => getUserId(assigned.userId) === sUserId);
                                                }).length === 0 ? (
                                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                                        No more staff available
                                                    </div>
                                                ) : (
                                                    <div className="p-2 space-y-1">
                                                        {gateStaffList.filter(s => {
                                                            const sUserId = getUserId(s.userId);
                                                            return !assignedStaff.some(assigned => getUserId(assigned.userId) === sUserId);
                                                        }).map(staff => (
                                                            <div
                                                                key={staff._id}
                                                                onClick={() => toggleStaffSelection(staff)}
                                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/5 cursor-pointer transition-colors"
                                                            >
                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedStaffIds.includes(staff._id)
                                                                    ? "bg-primary border-primary text-primary-foreground"
                                                                    : "border-muted-foreground/30 bg-background"
                                                                    }`}>
                                                                    {selectedStaffIds.includes(staff._id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-sm">{staff.userId?.name || 'Unknown Name'}</div>
                                                                    <div className="text-xs text-muted-foreground">{staff.userId?.email || 'No Email'} . {staff.userId?.phone || 'No Phone'}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddStaff}
                                    disabled={selectedStaffIds.length === 0}
                                    className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl font-semibold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Selected
                                </button>
                            </div>
                        </div>

                        {assignedStaff.length > 0 ? (
                            <div className="border border-border rounded-xl overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="bg-background-elevated border-b border-border">
                                        <tr>
                                            <th className="px-6 py-4 text-sm font-semibold text-foreground">Name</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-foreground">Contact</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-foreground">Gate Name *</th>
                                            <th className="px-6 py-4 text-sm font-semibold text-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {assignedStaff.map((staff, index) => (
                                            <tr key={staff._id || index} className="hover:bg-background-elevated/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-foreground">{staff.userId?.name}</div>
                                                    <div className="text-xs text-muted-foreground">{staff.userId?.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="w-3 h-3 text-muted-foreground" />
                                                        {staff.userId?.phone || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        value={staff.gateName || ''}
                                                        onChange={(e) => handleGateNameChange(index, e.target.value)}
                                                        placeholder="Enter Gate Name"
                                                        className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm"
                                                        required
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveStaff(staff._id)}
                                                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                        title="Remove staff"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                                    <Users className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-sm font-medium text-foreground">No gate staff assigned</p>
                                <p className="text-xs text-muted-foreground mt-1">Select a staff member above to add them to this event</p>
                            </div>
                        )}
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
                        disabled={loading || isSubmitting}
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