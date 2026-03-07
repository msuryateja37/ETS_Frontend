"use client";

import { X, AlertTriangle, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function DeleteConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Delete Confirmation",
    message = "Are you sure you want to delete this item? This action cannot be undone.",
    itemName = "",
    confirmText = "Delete Permanently",
    loading = false
}) {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* Glassmorphic Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-md"
                onClick={onClose}
            ></div>

            {/* Dialog Container */}
            <div
                className={`relative w-full max-w-md bg-card border border-primary/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 transform ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
            >
                {/* Top Accent Gradient */}
                <div className="h-1.5 bg-gradient-to-r from-destructive via-primary to-destructive"></div>

                <div className="p-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="p-3 bg-destructive/10 rounded-2xl">
                            <AlertTriangle className="w-6 h-6 text-destructive" />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-primary/10 rounded-xl text-muted-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-black text-foreground tracking-tight">
                            {title}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            {message}
                            {itemName && (
                                <span className="block mt-2 font-bold text-foreground">
                                    "{itemName}"
                                </span>
                            )}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4 mt-10">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-2 py-2 bg-background-elevated border border-border rounded-xl font-bold text-muted-foreground hover:bg-background-hover transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 px-2 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold transition-all shadow-lg hover:shadow-destructive/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Trash2 className="w-5 h-5" />
                                    {confirmText}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Bottom Decorative Pattern */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
}
