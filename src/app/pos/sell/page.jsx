"use client";

import RoleGuard from "@/app/components/RoleGuard";
import Navbar from "@/app/components/Navbar";
import { Ticket, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function POSSellPage() {
    const router = useRouter();

    return (
        <RoleGuard allowedRoles={["TICKETING"]}>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-7xl mx-auto px-6 py-12">
                    <button
                        onClick={() => router.push("/pos")}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to POS Home
                    </button>

                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="p-6 rounded-3xl bg-primary/10 border border-primary/30 mb-6">
                            <Ticket className="w-12 h-12 text-primary" />
                        </div>
                        <h1 className="text-3xl font-black text-foreground mb-3">Sell Ticket</h1>
                        <p className="text-muted-foreground max-w-md">
                            The walk-in ticket sale flow is coming soon. This page will allow POS staff to
                            search events, select seats, and process payments directly at the counter.
                        </p>
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
