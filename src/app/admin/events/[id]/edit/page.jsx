'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Edit2 } from 'lucide-react';
import AdminEventForm from '@/app/components/AdminEventForm';
import RoleGuard from '@/app/components/RoleGuard';
import Navbar from '@/app/components/Navbar';

export default function EditEventPage({ params }) {
    const { id } = React.use(params);
    const router = useRouter();
    const { token } = useAuth();
    const [initialAssignments, setInitialAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);

    useEffect(() => {
        if (!token) return;

        const fetchEventAndStaff = async () => {
            try {
                // Fetch Event
                const eventResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                let eventData = null;
                if (eventResponse.ok) {
                    eventData = await eventResponse.json();
                } else {
                    console.error('Failed to fetch event');
                    alert('Event not found');
                    router.push('/admin/events');
                    return;
                }

                // Fetch Gate Staff Assignments
                const assignmentsResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gatestaffassignment/event/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                let assignments = [];
                if (assignmentsResponse.ok) {
                    assignments = await assignmentsResponse.json();
                }

                setInitialAssignments(assignments);
                setEvent({ ...eventData, gateStaff: assignments });

            } catch (error) {
                console.error('Error fetching event data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEventAndStaff();
    }, [id, router, token]);

    const handleSubmit = async (formData) => {
        try {
            const { gateStaff, ...eventData } = formData;

            // 1. Update Event
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventData),
            });

            if (response.ok) {
                // 2. Reconcile Gate Staff Assignments
                const currentAssignments = gateStaff || [];
                console.log('Current Assignments (Form):', currentAssignments);
                console.log('Initial Assignments (DB):', initialAssignments);

                const getUserId = (staff) => {
                    if (!staff.userId) return null;
                    return typeof staff.userId === 'object' ? staff.userId._id : staff.userId;
                };

                // Identify ADDs
                const toAdd = currentAssignments.filter(curr => {
                    const currId = getUserId(curr);
                    return !initialAssignments.some(init => getUserId(init) === currId);
                });

                // Identify DELETEs
                const toDelete = initialAssignments.filter(init => {
                    const initId = getUserId(init);
                    return !currentAssignments.some(curr => getUserId(curr) === initId);
                });

                // Identify UPDATEs (only if gateName changed)
                const toUpdate = currentAssignments.filter(curr => {
                    const currId = getUserId(curr);
                    const init = initialAssignments.find(i => getUserId(i) === currId);
                    return init && init.gateName !== curr.gateName;
                });

                const apiPromises = [];

                // Execute Adds
                toAdd.forEach(staff => {
                    console.log('Adding staff:', staff);
                    const userId = getUserId(staff);
                    if (!userId) {
                        console.error('Missing userId for staff:', staff);
                        return;
                    }
                    apiPromises.push(
                        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gatestaffassignment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                userId: userId,
                                eventId: id,
                                gateName: staff.gateName
                            })
                        }).then(res => {
                            if (!res.ok) console.error('Failed to add staff:', userId, res.status);
                            return res.json();
                        })
                    );
                });

                // Execute Deletes
                toDelete.forEach(staff => {
                    console.log('Deleting staff:', staff);
                    apiPromises.push(
                        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gatestaffassignment/${staff._id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        }).then(res => {
                            if (!res.ok) console.error('Failed to delete staff:', staff._id, res.status);
                        })
                    );
                });

                // Execute Updates (using the assignment ID from initialAssignments)
                toUpdate.forEach(staff => {
                    const currId = getUserId(staff);
                    const init = initialAssignments.find(i => getUserId(i) === currId);
                    if (init) {
                        console.log('Updating staff:', staff);
                        apiPromises.push(
                            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gatestaffassignment/${init._id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({
                                    gateName: staff.gateName
                                })
                            }).then(res => {
                                if (!res.ok) console.error('Failed to update staff:', init._id, res.status);
                            })
                        );
                    }
                });

                await Promise.all(apiPromises);

                router.push(`/admin/events/${id}`);
            } else {
                console.error('Failed to update event');
                const errorData = await response.json();
                alert(`Error updating event: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating event:', error);
            alert('An error occurred while updating the event.');
        }
    };

    if (loading) {
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
                    <AdminEventForm initialData={event} onSubmit={handleSubmit} />
                </div>
            </div>
        </RoleGuard>
    );
}
