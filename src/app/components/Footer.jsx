"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin, ChevronRight, Home, Ticket, Heart, Users, MessageCircle, Sparkles, Star } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";

export default function Footer() {
    const { user } = useAuth();
    const currentYear = new Date().getFullYear();

    // Get navigation items based on role (same logic as Navbar)
    const getQuickLinks = () => {
        if (!user) {
            return [
                { href: '/', label: 'Home', icon: Home }
            ];
        }

        switch (user.role) {
            case "ADMIN":
                return [
                    { href: '/', label: 'Home', icon: Home },
                    { href: '/admin/users', label: 'Users', icon: Users },
                    { href: '/admin/events', label: 'Events', icon: Sparkles },
                    { href: '/admin/analytics', label: 'Analytics', icon: Ticket }
                ];
            case "CUSTOMER":
                return [
                    { href: '/', label: 'Home', icon: Home },
                    { href: '/customer/tickets', label: 'My Tickets', icon: Ticket },
                    { href: '/customer/likes', label: 'Liked', icon: Heart },
                    { href: '/customer/favorites', label: 'Favorites', icon: Star },
                    { href: '/customer/contactus', label: 'Contact Us', icon: MessageCircle }
                ];
            case "TICKETING":
                return [
                    { href: '/', label: 'Home', icon: Home },
                    { href: '/ticketing/tickets', label: 'Tickets', icon: Ticket }
                ];
            case "GATE":
            case "MANAGEMENT":
                return [
                    { href: '/', label: 'Home', icon: Home }
                ];
            default:
                return [
                    { href: '/', label: 'Home', icon: Home }
                ];
        }
    };

    const quickLinks = getQuickLinks();

    return (
        <footer className="relative bg-background pt-20 pb-8 px-6 mt-auto border-t border-primary/20">
            <div className="max-w-[1920px] mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">

                    {/* Logo & Description */}
                    <div className="space-y-6">
                        <div className="relative w-48 h-24 mb-2">
                            <Image
                                src="/EP_Logo_nobg.png"
                                alt="Emperors Palace Logo"
                                fill
                                className="object-contain brightness-0 invert opacity-90"
                            />
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            Experience world-class entertainment and unforgettable moments at Emperors Palace. Your premier destination for events and gaming.
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="#"
                                className="p-3 bg-card hover:bg-primary/20 rounded-lg transition-all duration-300 text-primary hover:scale-110 border border-border-light hover:border-primary/50"
                                aria-label="Facebook"
                            >
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="p-3 bg-card hover:bg-primary/20 rounded-lg transition-all duration-300 text-primary hover:scale-110 border border-border-light hover:border-primary/50"
                                aria-label="Twitter"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="p-3 bg-card hover:bg-primary/20 rounded-lg transition-all duration-300 text-primary hover:scale-110 border border-border-light hover:border-primary/50"
                                aria-label="Instagram"
                            >
                                <Instagram className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-foreground font-bold mb-6 text-lg relative inline-block uppercase tracking-wider">
                            Quick Links
                            <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-primary rounded-full"></span>
                        </h4>
                        <ul className="space-y-3 mt-8">
                            {quickLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-2 group"
                                    >
                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -ml-6 group-hover:ml-0 transition-all" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h4 className="text-foreground font-bold mb-6 text-lg relative inline-block uppercase tracking-wider">
                            Contact Us
                            <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-primary rounded-full"></span>
                        </h4>
                        <div className="space-y-5 mt-8">
                            <div className="flex items-start gap-4 group">
                                <div className="p-2 bg-card rounded-lg group-hover:bg-primary/10 transition-colors border border-border-light group-hover:border-primary/30">
                                    <MapPin className="w-5 h-5 text-primary" />
                                </div>
                                <span className="text-muted-foreground text-sm leading-relaxed">
                                    64 Jones Rd, Kempton Park,<br />Johannesburg, 1627
                                </span>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="p-2 bg-card rounded-lg group-hover:bg-primary/10 transition-colors border border-border-light group-hover:border-primary/30">
                                    <Phone className="w-5 h-5 text-primary" />
                                </div>
                                <a href="tel:+27119281000" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                                    +27 11 928 1000
                                </a>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="p-2 bg-card rounded-lg group-hover:bg-primary/10 transition-colors border border-border-light group-hover:border-primary/30">
                                    <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <a href="mailto:info@emperorspalace.com" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                                    info@emperorspalace.com
                                </a>
                            </div>
                        </div>

                        {/* Newsletter Signup */}
                        <div className="mt-8 pt-8 border-t border-border-light">
                            <p className="text-muted-foreground text-sm mb-3">Subscribe to our Newsletter</p>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Your email"
                                    className="flex-1 px-4 py-2 bg-card border border-border-light rounded-lg text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-muted focus:bg-background-hover transition-all backdrop-blur-sm"
                                    onChange={(e) => e.target.value = e.target.value.toLowerCase()}
                                />
                                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary-dark transition-all hover:scale-105">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Responsible Gaming Notice */}
                <div className="mb-8 p-6 bg-card border border-border-light rounded-xl backdrop-blur-sm">
                    <p className="text-muted-foreground text-xs leading-relaxed text-center">
                        <span className="font-semibold text-foreground">Emperors Palace proudly supports responsible gambling.</span>
                        <br className="my-1" />
                        No person under the age of 18 years permitted to gamble. National Responsible Gambling Foundation toll-free counselling line:
                        <a href="tel:0800006008" className="text-secondary-foreground hover:text-foreground mx-1">0800 006 008</a>
                        or WhatsApp HELP to
                        <a href="https://wa.me/27766750710" className="text-secondary-foreground hover:text-foreground mx-1">076 675 0710</a>
                        <br className="my-1" />
                        <span className="font-semibold">Winners know when to stop.</span>
                    </p>
                </div>

                {/* Footer Bottom */}
                <div className="pt-8 border-t border-border-light flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <p className="text-muted-foreground text-xs mb-1">
                            © {currentYear} Emperors Palace. All rights reserved.
                        </p>
                        <p className="text-muted text-xs">
                            A Peermont Resort - Open 24/7, 365 days a year
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {[
                            { href: '/privacy', label: 'Privacy Policy' },
                            { href: '/terms', label: 'Terms of Service' },
                            { href: '/cookies', label: 'Cookie Policy' },
                            { href: '/responsible-gaming', label: 'Responsible Gaming' }
                        ].map((link, index) => (
                            <React.Fragment key={link.href}>
                                <Link
                                    href={link.href}
                                    className="text-muted-foreground hover:text-secondary-foreground text-xs transition-colors"
                                >
                                    {link.label}
                                </Link>
                                {index < 3 && <span className="text-muted">•</span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}