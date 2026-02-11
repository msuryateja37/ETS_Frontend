"use client";

import { useState } from "react";
import { X, AlertCircle, Shield, CheckCircle2 } from "lucide-react";

export default function RoleChangeDialog({ user, onClose, onConfirm }) {
  const [selectedRole, setSelectedRole] = useState(user?.role || "CUSTOMER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roles = ["CUSTOMER", "ADMIN", "TICKETING", "GATE", "MANAGEMENT"];

  const handleConfirm = async () => {
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onConfirm(selectedRole);

      if (result && result.success) {
        // Success - close dialog
        onClose();
      } else {
        setError(result?.error || "Failed to update role");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Failed to update role");
      setLoading(false);
    }
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      CUSTOMER: "Standard user with access to book events and view tickets",
      ADMIN: "Full administrative access to manage users, events, and system settings",
      TICKETING: "Access to manage ticket sales and bookings",
      GATE: "Access to scan and validate tickets at event gates",
      MANAGEMENT: "Management-level access to view reports and analytics",
    };
    return descriptions[role];
  };

  // Prevent rendering if user is not available
  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay with animation */}
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="relative inline-block align-bottom bg-card rounded-2xl border border-border px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-8">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none"></div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground" id="modal-title">
                    Change User Role
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.name} • {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-background-elevated rounded-lg transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning */}
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive/90 font-medium">
                Changing a user's role will immediately affect their permissions and access levels.
              </p>
            </div>

            {/* New Role Selection */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-3">
                Select New Role
              </label>
              <div className="space-y-3">
                {roles.map((role) => (
                  <label
                    key={role}
                    className={`group flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedRole === role
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/40 hover:bg-background-elevated'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={selectedRole === role}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      disabled={loading}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-bold ${selectedRole === role ? 'text-primary' : 'text-foreground'}`}>
                            {role}
                          </span>
                          {role === user.role && (
                            <span className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-1 rounded-full border border-accent/20 font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {getRoleDescription(role)}
                        </p>
                      </div>
                      {selectedRole === role && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 text-sm font-semibold text-foreground bg-background-elevated border border-border rounded-xl hover:bg-background transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading || selectedRole === user.role}
                className="px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Confirm Change
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}