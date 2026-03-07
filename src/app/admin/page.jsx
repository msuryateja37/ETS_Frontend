"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, Ticket, DollarSign, TrendingUp, Settings, BarChart3, ArrowRight, Activity, ShieldCheck, Crown, Sparkles } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import { useAdminDashboardData } from "../../hooks/useAdmin";
import RoleGuard from "../components/RoleGuard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AdminHomePage({ logout }) {
  const { user } = useAuth();
  const router = useRouter();

  const { events, users, tickets, isLoading, isError } = useAdminDashboardData();

  const stats = useMemo(() => {
    if (!events || !users || !tickets) return {
      totalEvents: 0,
      totalUsers: 0,
      totalRevenue: 0,
      activeBookings: 0
    };

    return {
      totalEvents: events.length,
      totalUsers: users.length,
      totalRevenue: tickets.reduce((acc, t) => acc + (t.pricePaid || 0), 0),
      activeBookings: tickets.filter(t => t.status === 'VALID').length
    };
  }, [events, users, tickets]);

  const recentActivity = useMemo(() => {
    if (!users || !tickets) return { users: [], tickets: [] };

    const latestUsers = [...users]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2);

    const latestTickets = [...tickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2);

    return {
      users: latestUsers,
      tickets: latestTickets
    };
  }, [users, tickets]);

  const handleClickUserManagement = () => {
    router.push('/admin/users');
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);

    if (diffInMins < 60) return `${diffInMins} mins ago`;
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mb-6"></div>
          <p className="text-foreground font-semibold text-lg">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold text-lg">Error loading dashboard data.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          {/* Luxurious Welcome Header with Gold Accents */}
          <div className="mb-12 relative">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>

            <div className="pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                    Admin Dashboard
                  </h1>
                </div>
              </div>
            </div>

            {/* Decorative bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
          </div>

          {/* Elegant Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <StatsCard
              title="Total Events"
              value={stats.totalEvents}
              icon={Calendar}
              color="primary"
              trend="+12%"
              subtitle="Active listings"
            />
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              icon={Users}
              color="accent"
              trend="+5%"
              subtitle="Registered members"
            />
            <StatsCard
              title="Active Bookings"
              value={stats.activeBookings}
              icon={Ticket}
              color="muted"
              trend="+18%"
              subtitle="Valid tickets"
            />
            <StatsCard
              title="Revenue"
              value={`R${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              color="primary"
              trend="+24%"
              subtitle="Total earnings"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Premium Management Actions */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-3xl border border-border p-8 relative overflow-hidden">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Quick Management
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ActionButton
                      title="User Controls"
                      description="Edit roles and permissions"
                      icon={Users}
                      onClick={handleClickUserManagement}
                      color="primary"
                    />
                    <ActionButton
                      title="Event Management"
                      description="Create or modify events"
                      icon={Calendar}
                      onClick={() => router.push('/admin/events')}
                      color="accent"
                    />
                    <ActionButton
                      title="Financial Reports"
                      description="View detailed revenue"
                      icon={BarChart3}
                      onClick={() => router.push('/admin/reports')}
                      color="primary"
                    />
                    <ActionButton
                      title="System Settings"
                      description="Global configuration"
                      icon={Settings}
                      onClick={() => router.push('/admin/settings')}
                      color="muted"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Luxury Activity Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-card via-card to-card-elevated rounded-3xl border border-primary/20 p-8 h-full relative overflow-hidden">
                {/* Elegant decorative elements */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
                  </div>

                  <div className="space-y-4">
                    {/* Recent Users */}
                    {recentActivity.users.map((u, idx) => (
                      <div key={u._id || idx} className="group p-4 rounded-2xl bg-background-elevated border border-border-light hover:border-primary/40 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">New User</p>
                            <p className="text-sm text-muted-foreground truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">{formatRelativeTime(u.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Recent Ticket Sales */}
                    {recentActivity.tickets.map((t, idx) => (
                      <div key={t._id || idx} className="group p-4 rounded-2xl bg-background-elevated border border-border-light hover:border-primary/40 transition-all">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                            <DollarSign className="w-4 h-4 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground">Ticket Sold</p>
                            <p className="text-sm text-primary font-semibold">R{t.pricePaid}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">{formatRelativeTime(t.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {recentActivity.users.length === 0 && recentActivity.tickets.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-3 opacity-50">📊</div>
                        <p className="text-sm text-muted-foreground">No recent activity detected</p>
                      </div>
                    )}

                    <button
                      onClick={() => router.push('/admin/audit-logs')}
                      className="w-full mt-6 py-4 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group"
                    >
                      View Full Audit Log
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </RoleGuard>
  );
}

function StatsCard({ title, value, icon: Icon, color, trend, subtitle }) {
  const colorClasses = {
    primary: {
      bg: 'bg-primary/10',
      text: 'text-primary',
      border: 'border-primary/20'
    },
    accent: {
      bg: 'bg-accent/10',
      text: 'text-accent',
      border: 'border-accent/20'
    },
    muted: {
      bg: 'bg-muted/50',
      text: 'text-muted-foreground',
      border: 'border-muted/30'
    }
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div className="group bg-card rounded-2xl border border-border p-6 hover:border-primary/40 transition-all relative overflow-hidden">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${colors.bg} ${colors.border} border`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div className="flex items-center gap-1 px-3 py-1 bg-accent/10 rounded-full">
            <TrendingUp className="w-3 h-3 text-accent" />
            <span className="text-xs font-bold text-accent">{trend}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{title}</p>
          <p className="text-3xl font-black text-foreground mb-1">{value}</p>
          <p className="text-xs text-muted-foreground/60">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ title, description, icon: Icon, onClick, color }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground border-primary/20',
    accent: 'bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground border-accent/20',
    muted: 'bg-muted/30 text-muted-foreground group-hover:bg-muted group-hover:text-foreground border-muted/30'
  };

  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-4 p-5 bg-background-elevated border border-border-light rounded-2xl hover:border-primary/40 hover:bg-card transition-all text-left relative overflow-hidden"
    >
      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10 flex items-center gap-4 w-full">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground group-hover:text-primary transition-colors uppercase text-xs tracking-widest mb-1">
            {title}
          </p>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </button>
  );
}
