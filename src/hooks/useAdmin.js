"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

const fetcher = async (url, token, options = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch: ${res.statusText}`);
    }
    return res.json();
};

export const useEvents = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["events"],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events`, token),
        enabled: !!token,
    });
};

export const useUsers = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["users"],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user`, token),
        enabled: !!token,
    });
};

export const useTickets = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["tickets"],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/tickets`, token),
        enabled: !!token,
    });
};

export const useAdminDashboardData = () => {
    const eventsQuery = useEvents();
    const usersQuery = useUsers();
    const ticketsQuery = useTickets();

    const isLoading = eventsQuery.isLoading || usersQuery.isLoading || ticketsQuery.isLoading;
    const isError = eventsQuery.isError || usersQuery.isError || ticketsQuery.isError;
    const error = eventsQuery.error || usersQuery.error || ticketsQuery.error;

    return {
        events: eventsQuery.data,
        users: usersQuery.data,
        tickets: ticketsQuery.data,
        isLoading,
        isError,
        error,
        refetch: () => {
            eventsQuery.refetch();
            usersQuery.refetch();
            ticketsQuery.refetch();
        },
    };
};

export const useUpdateUserRole = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, newRole, oldRole, userToUpdate }) => {
            // 1. Update the user role
            await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user/${userId}`, token, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole }),
            });

            // 2. Handle side effects (Customer/Gate Staff records)
            const isChangingToCustomer = oldRole !== 'CUSTOMER' && newRole === 'CUSTOMER';
            const isChangingFromCustomer = oldRole === 'CUSTOMER' && newRole !== 'CUSTOMER';
            const isChangingFromGate = oldRole === 'GATE' && newRole !== 'GATE';

            if (isChangingToCustomer) {
                await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/customers`, token, {
                    method: 'POST',
                    body: JSON.stringify({
                        encryptedPII: {
                            name: userToUpdate.name,
                            email: userToUpdate.email,
                            phone: userToUpdate.phone || '',
                        },
                        userId: userToUpdate._id,
                        loyalty: { verified: false },
                    }),
                });
            } else if (isChangingFromCustomer) {
                const customer = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/email/${userToUpdate.email}`, token).catch(() => null);
                if (customer && customer._id) {
                    await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/${customer._id}`, token, {
                        method: 'DELETE',
                    });
                }
            }

            if (isChangingFromGate) {
                const gsRecords = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gate-staff/user/${userId}`, token).catch(() => []);
                for (const gs of gsRecords) {
                    await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gate-staff/${gs._id}`, token, {
                        method: 'DELETE',
                    });
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useUpdateUserPermissions = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, newPermissions }) =>
            fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user/${userId}/permissions`, token, {
                method: 'PATCH',
                body: JSON.stringify({ permissions: newPermissions }),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useDeleteUser = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId) => {
            // 1. Check if gate staff and cleanup if necessary
            const userRes = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user/${userId}`, token).catch(() => null);
            if (userRes && userRes.role === 'GATE') {
                const gsRecords = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gate-staff/user/${userId}`, token).catch(() => []);
                for (const gs of gsRecords) {
                    await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gate-staff/${gs._id}`, token, {
                        method: 'DELETE',
                    });
                }
            }

            // 2. Delete the user
            return fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user/${userId}`, token, {
                method: 'DELETE',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useDeleteEvent = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventId) =>
            fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${eventId}`, token, {
                method: 'DELETE',
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
    });
};

export const useCreateStaff = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (staffData) =>
            fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/auth/create-staff`, token, {
                method: "POST",
                body: JSON.stringify(staffData),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useUpdateEvent = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ eventId, eventData }) =>
            fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${eventId}`, token, {
                method: "PUT",
                body: JSON.stringify(eventData),
            }),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
            queryClient.invalidateQueries({ queryKey: ["event", variables.eventId] });
        },
    });
};

export const useUpdateEventWithStaff = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ eventId, eventData, assignmentsToAdd, assignmentsToDelete, assignmentsToUpdate }) => {
            // 1. Update event details
            const updatedEvent = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${eventId}`, token, {
                method: "PUT",
                body: JSON.stringify(eventData),
            });

            const apiPromises = [];

            // 2. Delete removed assignments
            if (assignmentsToDelete?.length > 0) {
                assignmentsToDelete.forEach(id => {
                    apiPromises.push(
                        fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gatestaffassignment/${id}`, token, {
                            method: "DELETE"
                        })
                    );
                });
            }

            // 3. Add new assignments
            if (assignmentsToAdd?.length > 0) {
                assignmentsToAdd.forEach(data => {
                    apiPromises.push(
                        fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gatestaffassignment`, token, {
                            method: "POST",
                            body: JSON.stringify({ ...data, eventId, gateStaffId: data.gateStaffId })
                        })
                    );
                });
            }

            // 4. Update existing assignments (e.g. gateName changed)
            if (assignmentsToUpdate?.length > 0) {
                assignmentsToUpdate.forEach(({ id, gateName }) => {
                    apiPromises.push(
                        fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gatestaffassignment/${id}`, token, {
                            method: "PUT",
                            body: JSON.stringify({ gateName })
                        })
                    );
                });
            }

            if (apiPromises.length > 0) {
                await Promise.all(apiPromises);
            }

            return updatedEvent;
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
            queryClient.invalidateQueries({ queryKey: ["event", variables.eventId] });
            queryClient.invalidateQueries({ queryKey: ["event-assignments", variables.eventId] });
        },
    });
};

export const useCreateEvent = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (eventData) =>
            fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events`, token, {
                method: "POST",
                body: JSON.stringify(eventData),
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
    });
};

export const useAssignGateStaff = () => {
    const { token } = useAuth();
    return useMutation({
        mutationFn: (assignmentData) =>
            fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gatestaffassignment`, token, {
                method: "POST",
                body: JSON.stringify(assignmentData),
            }),
    });
};

export const useMe = () => {
    const { token, user } = useAuth();
    return useQuery({
        queryKey: ["me", user?._id],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user/${user._id}`, token),
        enabled: !!token && !!user?._id,
    });
};

export const useUpdateProfile = () => {
    const { token, user, updateUser } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (formData) =>
            fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user/${user._id}`, token, {
                method: 'PUT',
                body: JSON.stringify(formData),
            }),
        onSuccess: (updatedUser) => {
            updateUser(updatedUser);
            queryClient.invalidateQueries({ queryKey: ["me", user?._id] });
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
};

export const useVenues = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["venues"],
        queryFn: async () => {
            const data = await fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/venue`, token);
            return data.venues || [];
        },
        enabled: !!token,
    });
};

export const useGateStaff = () => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["gate-staff"],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gate-staff`, token),
        enabled: !!token,
    });
};

export const useAdminEvent = (eventId) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["event", eventId],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/events/${eventId}`, token),
        enabled: !!token && !!eventId,
    });
};

export const useEventAssignments = (eventId) => {
    const { token } = useAuth();
    return useQuery({
        queryKey: ["event-assignments", eventId],
        queryFn: () => fetcher(`${process.env.NEXT_PUBLIC_BACKEND_URI}/gatestaffassignment/event/${eventId}`, token),
        enabled: !!token && !!eventId,
    });
};
