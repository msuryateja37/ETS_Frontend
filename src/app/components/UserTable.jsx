"use client";

import { useState } from "react";
import { Edit2, Shield, Calendar, CheckCircle, XCircle, Trash2 } from "lucide-react";
import RoleChangeDialog from "./RoleChange";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { formatDate } from "../utils/dateUtils";

export default function UserTable({ users, onRoleUpdate, onPermissionsUpdate, onDeleteUser }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: 'bg-slate-100 text-slate-800',
      CUSTOMER: 'bg-blue-100 text-blue-800',
      TICKETING: 'bg-green-100 text-green-800',
      GATE: 'bg-yellow-100 text-yellow-800',
      MANAGEMENT: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const handleRoleClick = (user) => {
    setSelectedUser(user);
    setShowRoleDialog(true);
  };

  const handleRoleChange = async (newRole) => {
    // Add null check here
    if (!selectedUser) {
      return { success: false, error: "No user selected" };
    }

    try {
      const result = await onRoleUpdate(selectedUser._id, newRole);
      if (result.success) {
        setShowRoleDialog(false);
        setSelectedUser(null);
      }
      return result;
    } catch (error) {
      console.error("Error in handleRoleChange:", error);
      return { success: false, error: error.message };
    }
  };

  const handleCloseDialog = () => {
    setShowRoleDialog(false);
    setShowDeleteDialog(false);
    setSelectedUser(null);
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      const result = await onDeleteUser(selectedUser._id);
      if (result.success) {
        handleCloseDialog();
      } else {
        alert(result.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("An error occurred while deleting the user");
    } finally {
      setIsDeleting(false);
    }
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
        <p className="text-gray-600">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name & Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-2 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {user._id.slice(-8)}
                    </div>
                  </td>
                  <td className="px-6 py-2">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap">
                    <button
                      onClick={() => handleRoleClick(user)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)} hover:opacity-80 transition-opacity cursor-pointer`}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      {user.role}
                    </button>
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {user.isActive ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(user.createdAt, { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-2">
                    <div className="text-sm text-gray-900">
                      {user.permissions && user.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {user.permissions.map((perm, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No permissions</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleRoleClick(user)}
                        className="text-primary hover:text-primary-dark flex items-center transition-colors"
                        title="Update Role"
                      >
                        <Edit2 className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenDeleteDialog(user)}
                        className="text-destructive hover:text-destructive/80 flex items-center transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showRoleDialog && selectedUser && (
        <RoleChangeDialog
          user={selectedUser}
          onClose={handleCloseDialog}
          onConfirm={handleRoleChange}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        title="Remove Staff Member"
        // message="Are you sure you want to remove this staff member from the Imperial Registry? This action will permanently revoke their access."
        itemName={selectedUser?.name}
        loading={isDeleting}
      />
    </>
  );
}