'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AdminEventForm from '@/app/components/AdminEventForm';
import RoleGuard from '@/app/components/RoleGuard';
import Navbar from '@/app/components/Navbar';

import { useCreateEvent, useAssignGateStaff } from '../../../../hooks/useAdmin';

export default function CreateEventPage() {
    const router = useRouter();
    const createEventMutation = useCreateEvent();
    const assignGateStaffMutation = useAssignGateStaff();

    const handleSubmit = async (formData) => {
        try {
            // Separate gate staff from event data
            const {
                gateStaff,
                portraitImageFile,
                landscapeImageFile,
                ...eventFields
            } = formData;

            // Build multipart form-data payload for event (supports file uploads & URLs)
            const body = new FormData();

            Object.entries(eventFields).forEach(([key, value]) => {
                if (value === undefined || value === null || key === 'images') return;

                if (key === 'zones' || key === 'eventContactDetails') {
                    body.append(key, JSON.stringify(value));
                } else {
                    body.append(key, String(value));
                }
            });

            if (portraitImageFile) {
                body.append('portraitImage', portraitImageFile);
            }
            if (landscapeImageFile) {
                body.append('landscapeImage', landscapeImageFile);
            }

            // 1. Create Event
            const newEvent = await createEventMutation.mutateAsync(body);
            const eventId = newEvent._id;

            // 2. Create Gate Staff Assignments
            if (gateStaff && gateStaff.length > 0) {
                console.log('Assigning Gate Staff:', gateStaff);
                try {
                    const assignmentPromises = gateStaff.map(staff => {
                        const userId = typeof staff.userId === 'object' ? staff.userId._id : staff.userId;

                        if (!userId) {
                            console.error('Invalid userId for staff:', staff);
                            return Promise.resolve(); // Skip invalid staff
                        }

                        return assignGateStaffMutation.mutateAsync({
                            userId: userId,
                            gateStaffId: staff._id,
                            eventId: eventId,
                            gateName: staff.gateName
                        });
                    });

                    await Promise.all(assignmentPromises);
                } catch (assignmentError) {
                    console.error('Error assigning gate staff:', assignmentError);
                    alert('Event created, but there was an error assigning some gate staff.');
                }
            }

            router.push('/admin/events');
        } catch (error) {
            console.error('Error creating event:', error);
            alert(error.message || 'An error occurred while creating the event.');
        }
    };

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <Navbar />
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Elegant Breadcrumb */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.push('/admin/events')}
                            className="group inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full text-muted-foreground font-medium hover:border-primary/40 hover:text-primary transition-all"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span>Back</span>
                        </button>
                    </div>

                    {/* Luxurious Header */}
                    <div className="bg-card rounded-3xl border border-border p-8 mb-8 relative overflow-hidden">
                        {/* Decorative gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                                    <Sparkles className="w-6 h-6 text-primary" />
                                </div>
                                <h1 className="text-4xl font-black text-foreground tracking-tight">
                                    Create New Event
                                </h1>
                            </div>

                        </div>

                        {/* Decorative line */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                    </div>

                    {/* Form */}
                    <AdminEventForm onSubmit={handleSubmit} />
                </div>
            </div>
        </RoleGuard>
    );
}