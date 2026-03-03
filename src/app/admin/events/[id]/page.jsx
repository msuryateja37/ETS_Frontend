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
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setEvent(data);
                } else {
                    console.error('Failed to fetch event');
                    alert('Event not found');
                    router.push('/admin/events');
                }
            } catch (error) {
                console.error('Error fetching event:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, router]);

    const handleSubmit = async (formData) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push('/admin/events');
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