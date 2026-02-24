"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const fetcher = async (url, token, options = {}) => {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch: ${res.statusText}`);
    }

    return res.json();
};

export const getSafeId = (data) => {
    if (!data) return null;
    if (typeof data === "string") return data;
    if (data?.$oid) return data.$oid;
    if (data?._id) return typeof data._id === "string" ? data._id : getSafeId(data._id);
    if (data?.id) return typeof data.id === "string" ? data.id : getSafeId(data.id);
    if (typeof data.toString === "function" && data.toString() !== "[object Object]") {
        return data.toString();
    }
    return null;
};

export const useCustomerEvents = (role = "CUSTOMER") => {
    return useQuery({
        queryKey: ["customer-events", role],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events?role=${role}`),
    });
};

export const usePastEvents = () => {
    return useQuery({
        queryKey: ["past-events"],
        queryFn: async () => {
            const data = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events?timeframe=past`);
            // Sort events by date in descending order (latest first)
            return (data || []).sort((a, b) =>
                new Date(b.startDateTime || b.startDate) - new Date(a.startDateTime || a.startDate)
            );
        },
    });
};

export const useCustomerProfile = (userId) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["customer-profile", userId],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/user/${userId}`, token),
        enabled: !!userId && !!token,
        retry: (failureCount, error) => {
            // Don't retry on 401
            if (error.message.includes("401")) return false;
            return failureCount < 3;
        }
    });
};

export const useToggleLike = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ customerId, eventId, isLiked }) => {
            const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/${customerId}/like-event`;
            const method = isLiked ? 'DELETE' : 'POST';

            return fetcher(endpoint, token, {
                method,
                body: JSON.stringify({ eventId }),
            });
        },
        onSuccess: (_, { eventId }) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
            queryClient.invalidateQueries({ queryKey: ["customer-events"] });
            // Also potentially invalidate single event query if it exists
            queryClient.invalidateQueries({ queryKey: ["event", eventId] });
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
    });
};

export const useCustomerOrders = (userId) => {
    const { token } = useAuth();
    const base = process.env.NEXT_PUBLIC_BACKEND_URI;

    return useQuery({
        queryKey: ["customer-orders", userId],
        queryFn: async () => {
            // 1. Fetch orders
            const orderData = await fetcher(`${base}/orders/user/${userId}`, token);

            // 2. Extract event IDs
            const eventIds = [...new Set(orderData.map((o) => getSafeId(o.eventId)).filter(Boolean))];

            const eventsMap = new Map();
            if (eventIds.length > 0) {
                const eventsList = await fetcher(`${base}/events/batch`, token, {
                    method: "POST",
                    body: JSON.stringify({ ids: eventIds }),
                });
                (Array.isArray(eventsList) ? eventsList : []).forEach((e) => eventsMap.set(getSafeId(e), e));
            }

            // 3. Enrich orders
            const enrichedOrders = await Promise.all(
                orderData.map(async (order) => {
                    const oid = getSafeId(order);
                    const eid = getSafeId(order.eventId);
                    const eventDetails = eventsMap.get(eid) || null;

                    // Fetch tickets
                    let tickets = [];
                    try {
                        tickets = await fetcher(`${base}/orders/${oid}/tickets`, token);
                    } catch (e) {
                        console.error(`Error fetching tickets for order ${oid}:`, e);
                    }

                    // Fetch venue details
                    let venueName = "Venue TBA";
                    let venueDetails = null;
                    if (eventDetails?.venueId) {
                        if (typeof eventDetails.venueId === "object" && eventDetails.venueId.sections) {
                            venueDetails = eventDetails.venueId;
                            venueName = venueDetails.name;
                        } else {
                            const vid = getSafeId(eventDetails.venueId);
                            try {
                                venueDetails = await fetcher(`${base}/venue/${vid}`, token);
                                venueName = venueDetails.name;
                            } catch (e) { }
                        }
                    }

                    // Fetch seat details
                    const ticketsWithSeats = await Promise.all(
                        tickets.map(async (ticket) => {
                            const sid = getSafeId(ticket.seatId);
                            let seatDetails = null;
                            if (sid) {
                                try {
                                    seatDetails = await fetcher(`${base}/seats/${sid}`, token);
                                } catch (e) { }
                            }
                            return { ...ticket, seatDetails };
                        })
                    );

                    return {
                        ...order,
                        eventDetails,
                        venueDetails,
                        tickets: ticketsWithSeats,
                        venueName,
                        ticketCount: tickets.length,
                    };
                })
            );

            const now = new Date();
            return enrichedOrders.sort((a, b) => {
                const dateA = new Date(a.eventDetails?.startDateTime || 0);
                const dateB = new Date(b.eventDetails?.startDateTime || 0);
                const isUpcomingA = dateA > now;
                const isUpcomingB = dateB > now;

                if (isUpcomingA && !isUpcomingB) return -1;
                if (!isUpcomingA && isUpcomingB) return 1;

                if (isUpcomingA) return dateA - dateB;
                return dateB - dateA;
            });
        },
        enabled: !!userId && !!token,
    });
};

export const useOrderDetails = (orderId) => {
    const { token } = useAuth();
    const base = process.env.NEXT_PUBLIC_BACKEND_URI;

    return useQuery({
        queryKey: ["order-details", orderId],
        queryFn: async () => {
            // Fetch order with tickets
            const data = await fetcher(`${base}/orders/${orderId}/with-tickets`, token);
            const order = data.order;
            const tickets = data.tickets;

            // Fetch event details
            const eid = getSafeId(order.eventId);
            let eventDetails = null;
            if (eid) {
                try {
                    eventDetails = await fetcher(`${base}/events/${eid}`, token);
                } catch (e) { }
            }

            // Fetch venue details
            let venueDetails = null;
            if (eventDetails?.venueId) {
                const vid = getSafeId(eventDetails.venueId);
                try {
                    venueDetails = await fetcher(`${base}/venue/${vid}`, token);
                } catch (e) { }
            }

            // Fetch seat details
            const ticketsWithSeats = await Promise.all(
                tickets.map(async (ticket) => {
                    const sid = getSafeId(ticket.seatId);
                    let seatDetails = null;
                    if (sid) {
                        try {
                            seatDetails = await fetcher(`${base}/seats/${sid}`, token);
                        } catch (e) { }
                    }
                    return { ...ticket, seatDetails };
                })
            );

            return {
                ...order,
                eventDetails,
                venueDetails,
                tickets: ticketsWithSeats,
                ticketCount: tickets.length,
            };
        },
    });
};

export const useEventDetails = (eventId, role = 'CUSTOMER') => {
    const { token } = useAuth();
    const base = process.env.NEXT_PUBLIC_BACKEND_URI;

    return useQuery({
        queryKey: ["event-details", eventId, role],
        queryFn: async () => {
            const eventData = await fetcher(`${base}/events/${eventId}?role=${role}`, token);

            let venueData = null;
            let venueDetailsData = null;

            const venueId = getSafeId(eventData.venueId) || getSafeId(eventData.venue);

            if (venueId) {
                try {
                    // Fetch full venue object (with sections, dimensions, etc.)
                    venueData = await fetcher(`${base}/venue/${venueId}`, token);

                    // Fetch additional venue details (contact info, map link, etc.)
                    venueDetailsData = await fetcher(`${base}/venue-details/venue/${venueId}`, token);
                } catch (err) {
                    console.warn('Venue or venue details not found', err);
                    // If venueDetails fails, we still want the basic venue object if we can get it
                    if (!venueData && typeof eventData.venueId === 'object') {
                        venueData = eventData.venueId;
                    }
                }
            }

            return { event: eventData, venue: venueData, venueDetails: venueDetailsData };
        },
        enabled: !!eventId,
    });
};

export const useConfirmPurchase = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (purchaseData) =>
            fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/seats/confirm`, token, {
                method: "POST",
                body: JSON.stringify(purchaseData),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
        },
    });
};

export const useEventSeats = (eventId) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["event-seats", eventId],
        queryFn: async () => {
            const data = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/seats/event/${eventId}`, token);
            return data.seats || [];
        },
        enabled: !!eventId,
    });
};

export const useLockSeats = () => {
    const { token } = useAuth();
    return useMutation({
        mutationFn: (lockData) =>
            fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/seats/lock-multiple`, token, {
                method: "POST",
                body: JSON.stringify(lockData),
            }),
    });
};

export const useToggleFavorite = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ customerId, eventId, isFavorite }) => {
            const endpoint = `${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/${customerId}/favorite-event`;
            const method = isFavorite ? 'DELETE' : 'POST';

            return fetcher(endpoint, token, {
                method,
                body: JSON.stringify({ eventId }),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customer-profile"] });
        },
    });
};

export const useLikedEvents = (eventIds) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["liked-events", eventIds],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/batch`, token, {
            method: "POST",
            body: JSON.stringify({ ids: eventIds }),
        }),
        enabled: !!eventIds && eventIds.length > 0 && !!token,
    });
};
