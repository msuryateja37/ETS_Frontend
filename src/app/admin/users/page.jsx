"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { ArrowLeft, Search, Filter, Users as UsersIcon, Shield, ChevronLeft, ChevronRight, Activity, UserPlus, X, Crown, Sparkles } from "lucide-react";
import UserTable from "../../components/UserTable";
import RoleGuard from "../../components/RoleGuard";
import Navbar from "../../components/Navbar";
import Footer from "@/app/components/Footer";

export default function UserManagementPage() {
  const router = useRouter();
  const { user: authUser, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentUser, setCurrentUser] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  //key value pair role:label
  const roles = [
    { role: "ALL", label: "All Roles" },
    { role: "CUSTOMER", label: "Customer" },
    { role: "ADMIN", label: "Admin" },
    { role: "TICKETING", label: "Ticketing Agent" },
    { role: "GATE", label: "Gate Staff" },
    { role: "MANAGEMENT", label: "Management" }
  ];

  useEffect(() => {
    // Get current logged-in user
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, roleFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();

      // Filter out the currently logged-in user
      const currentUserId = authUser ? authUser._id : null;

      const filteredData = data.filter(user => user._id !== currentUserId);

      // Sort by creation date (newest first)
      const sortedData = filteredData.sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setUsers(sortedData);

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply role filter
    if (roleFilter !== "ALL") {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user._id?.toLowerCase().includes(query)
      );
    }
    setFilteredUsers(filtered);
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      // First, fetch the current user to get their existing role
      const userResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!userResponse.ok) {
        throw new Error('Failed to fetch user');
      }
      const userToUpdate = await userResponse.json();
      const oldRole = userToUpdate.role;

      // Update the user role
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Handle customer record creation/deletion based on role change
      const isChangingToCustomer = oldRole !== 'CUSTOMER' && newRole === 'CUSTOMER';
      const isChangingFromCustomer = oldRole === 'CUSTOMER' && newRole !== 'CUSTOMER';

      if (isChangingToCustomer) {
        // Create customer record
        const customerData = {
          encryptedPII: {
            name: userToUpdate.name,
            email: userToUpdate.email,
            phone: userToUpdate.phone || '',
          },
          userId: userToUpdate._id,
          loyalty: {
            verified: false,
          },
        };

        const customerResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/customers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(customerData),
        });

        if (!customerResponse.ok) {
          console.error('Failed to create customer record');
        }
      } else if (isChangingFromCustomer) {
        // Find and delete customer record by email
        const customerResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/email/${userToUpdate.email}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (customerResponse.ok) {
          const customer = await customerResponse.json();
          if (customer && customer._id) {
            const deleteResponse = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URI}/customers/${customer._id}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );

            if (!deleteResponse.ok) {
              console.error('Failed to delete customer record');
            }
          }
        }
      }

      // Refresh users list
      await fetchUsers();

      return { success: true };
    } catch (error) {
      console.error('Error updating role:', error);
      return { success: false, error: error.message };
    }
  };

  const handlePermissionsUpdate = async (userId, newPermissions) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URI}/user/${userId}/permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions: newPermissions }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      // Refresh users list
      await fetchUsers();

      return { success: true };
    } catch (error) {
      console.error('Error updating permissions:', error);
      return { success: false, error: error.message };
    }
  };

  // Pagination calculations
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      if (startPage > 2) pageNumbers.push('...');
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
      if (endPage < totalPages - 1) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mb-6"></div>
          <p className="text-foreground font-semibold text-lg">Analyzing User Base...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 md:pb-8">
          {/* Luxurious Header */}
          <div className="mb-12 relative">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>

            <div className="py-4">
              {/* Back Button */}
              <div className="mb-6">
                <button
                  onClick={() => router.back()}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full text-muted-foreground font-medium hover:border-primary/40 hover:text-primary transition-all"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                  <span>Back</span>
                </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-2 flex flex-wrap items-center gap-4">
                      User Management
                      <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-base font-bold border border-primary/20">
                        {users.length} Total
                      </span>
                    </h1>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/admin/users/create')}
                  className="group flex items-center gap-3 px-8 py-4 bg-primary hover:bg-primary-dark text-primary-foreground rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Add New Staff
                </button>
              </div>
            </div>

            {/* Decorative bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
          </div>

          {/* Elegant Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-10">
            <MiniStat label="Customers" count={users.filter(u => u.role === 'CUSTOMER').length} color="primary" />
            <MiniStat label="Admins" count={users.filter(u => u.role === 'ADMIN').length} color="primary" />
            <MiniStat label="Ticketing" count={users.filter(u => u.role === 'TICKETING').length} color="accent" />
            <MiniStat label="Gate Staff" count={users.filter(u => u.role === 'GATE').length} color="accent" />
            <MiniStat label="Management" count={users.filter(u => u.role === 'MANAGEMENT').length} color="primary" />
            <MiniStat label="Active" count={users.filter(u => u.isActive).length} color="accent" icon={<Activity className="w-3 h-3" />} />
          </div>

          {/* Filters & Search */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8 relative overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-6">
              {/* Search */}
              <div className="flex-1 relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-background-elevated border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground placeholder:text-muted-foreground"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Role Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {roles.map(role => (
                  <button
                    key={role.role}
                    onClick={() => setRoleFilter(role.role)}
                    className={`px-5 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap border-2 ${roleFilter === role.role
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                      : 'bg-background-elevated border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5'
                      }`}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-destructive/10 border-2 border-destructive/20 text-destructive px-6 py-4 rounded-2xl mb-8 flex items-center gap-3">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
              <p className="font-bold text-sm">{error}</p>
            </div>
          )}

          {/* Users Table Container */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-8 shadow-lg">
            <UserTable
              users={currentUsers}
              onRoleUpdate={handleRoleUpdate}
              onPermissionsUpdate={handlePermissionsUpdate}
              onRefresh={fetchUsers}
            />
          </div>

          {/* Elegant Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card rounded-2xl p-6 border border-border">
              <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Showing {indexOfFirstUser + 1} - {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`p-2.5 rounded-xl transition-all border-2 ${currentPage === 1
                    ? 'border-border text-muted-foreground/30 cursor-not-allowed'
                    : 'border-border text-primary hover:bg-primary/10 hover:border-primary/40 active:scale-90'
                    }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {getPageNumbers().map((pageNum, index) => (
                    pageNum === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-3 text-muted-foreground/50">...</span>
                    ) : (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-11 h-11 rounded-xl text-sm font-black transition-all border-2 ${currentPage === pageNum
                          ? 'bg-primary border-primary text-primary-foreground shadow-lg'
                          : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5'
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2.5 rounded-xl transition-all border-2 ${currentPage === totalPages
                    ? 'border-border text-muted-foreground/30 cursor-not-allowed'
                    : 'border-border text-primary hover:bg-primary/10 hover:border-primary/40 active:scale-90'
                    }`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="sm:hidden text-xs font-bold text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          )}
        </div>
        <Footer />
      </div>
    </RoleGuard>
  );
}

function MiniStat({ label, count, color, icon }) {
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
    }
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div className="group bg-card p-5 rounded-2xl border border-border hover:border-primary/40 transition-all relative overflow-hidden">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{label}</p>
          <p className="text-2xl font-black text-foreground">{count}</p>
        </div>
        <div className={`p-2.5 rounded-xl border ${colors.bg} ${colors.text} ${colors.border} group-hover:scale-110 transition-transform`}>
          {icon || <UsersIcon className="w-4 h-4" />}
        </div>
      </div>
    </div>
  );
}
