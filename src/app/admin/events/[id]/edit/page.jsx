'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAdminEvent, useEventAssignments, useUpdateEventWithStaff } from '@/hooks/useAdmin';
import { ArrowLeft, Edit2 } from 'lucide-react';
import AdminEventForm from '@/app/components/AdminEventForm';
import RoleGuard from '@/app/components/RoleGuard';
import Navbar from '@/app/components/Navbar';

export default function EditEventPage({ params }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { token } = useAuth();

    // Data Fetching
    const { data: eventData, isLoading: isEventLoading, isError: isEventError } = useAdminEvent(id);
    const { data: initialAssignments = [], isLoading: isAssignmentsLoading } = useEventAssignments(id);

    // Mutations
    const updateMutation = useUpdateEventWithStaff();

    const handleSubmit = async (formData) => {
        try {
            const { gateStaff: currentAssignments = [], ...eventFields } = formData;

            const getUserId = (staff) => {
                if (!staff.userId) return null;
                return typeof staff.userId === 'object' ? staff.userId._id : staff.userId;
            };

            // Identify ADDs
            const assignmentsToAdd = currentAssignments.filter(curr => {
                const currId = getUserId(curr);
                return !initialAssignments.some(init => getUserId(init) === currId);
            }).map(staff => ({
                userId: getUserId(staff),
                gateStaffId: staff._id,
                gateName: staff.gateName
            }));

            // Identify DELETEs
            const assignmentsToDelete = initialAssignments
                .filter(init => {
                    const initId = getUserId(init);
                    return !currentAssignments.some(curr => getUserId(curr) === initId);
                })
                .map(init => init._id);

            // Identify UPDATEs
            const assignmentsToUpdate = currentAssignments
                .filter(curr => {
                    const currId = getUserId(curr);
                    const init = initialAssignments.find(i => getUserId(i) === currId);
                    return init && init.gateName !== curr.gateName;
                })
                .map(curr => {
                    const init = initialAssignments.find(i => getUserId(i) === getUserId(curr));
                    return { id: init._id, gateName: curr.gateName };
                });

            await updateMutation.mutateAsync({
                eventId: id,
                eventData: eventFields,
                assignmentsToAdd,
                assignmentsToDelete,
                assignmentsToUpdate
            });

            router.push(`/admin/events/${id}`);
        } catch (error) {
            console.error('Error updating event:', error);
            alert('An error occurred while updating the event: ' + error.message);
        }
    };

    const isLoading = isEventLoading || isAssignmentsLoading;

    if (isLoading) {
        return (
            <RoleGuard allowedRoles={["ADMIN"]}>
                <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
                        <p className="mt-6 text-foreground font-semibold text-lg">Loading Event Details...</p>
                    </div>
                </div>
            </RoleGuard>
        );
    }

    if (isEventError || !eventData) {
        return (
            <RoleGuard allowedRoles={["ADMIN"]}>
                <div className="min-h-screen bg-background p-6 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground">Event not found</h2>
                        <button onClick={() => router.push('/admin/events')} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg">
                            Back to Events
                        </button>
                    </div>
                </div>
            </RoleGuard>
        );
    }

    const eventWithStaff = { ...eventData, gateStaff: initialAssignments };

    return (
        <RoleGuard allowedRoles={["ADMIN"]}>
            <Navbar />
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-5xl mx-auto">
                    {/* Elegant Breadcrumb */}
                    <div className="mb-6">
                        <button
                            onClick={() => router.push(`/admin/events/${id}`)}
                            className="group inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full text-muted-foreground font-medium hover:border-primary/40 hover:text-primary transition-all"
                        >
                            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            <span>Back to Details</span>
                        </button>
                    </div>

                    {/* Luxurious Header */}
                    <div className="bg-card rounded-3xl border border-border p-8 mb-8 relative overflow-hidden">
                        {/* Decorative gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                                    <Edit2 className="w-6 h-6 text-primary" />
                                </div>
                                <h1 className="text-4xl font-black text-foreground tracking-tight">
                                    Edit Event
                                </h1>
                            </div>
                        </div>

                        {/* Decorative line */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                    </div>

                    {/* Form */}
                    <AdminEventForm
                        initialData={eventWithStaff}
                        onSubmit={handleSubmit}
                        isSubmitting={updateMutation.isPending}
                    />
                </div>
            </div>
        </RoleGuard>
    );
}
