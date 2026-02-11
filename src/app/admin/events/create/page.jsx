'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Sparkles } from 'lucide-react';
import AdminEventForm from '@/app/components/AdminEventForm';
import RoleGuard from '@/app/components/RoleGuard';
import Navbar from '@/app/components/Navbar';

export default function CreateEventPage() {
    const router = useRouter();
    const { token } = useAuth();

    const handleSubmit = async (formData) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push('/admin/events');
            } else {
                console.error('Failed to create event');
                const errorData = await response.json();
                alert(`Error creating event: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error creating event:', error);
            alert('An error occurred while creating the event.');
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