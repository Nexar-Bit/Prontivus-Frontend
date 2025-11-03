/**
 * Protected Route Component
 * Wraps components that require specific permissions
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredModule?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredModule,
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { canAccess, isStaff } = usePermissions();
  const router = useRouter();

  // If no specific requirements, just check if user is staff (not patient)
  if (!requiredRole && !requiredModule) {
    if (!isStaff()) {
      if (fallback) return <>{fallback}</>;
      router.push(redirectTo);
      return null;
    }
    return <>{children}</>;
  }

  // Check specific permissions
  if (!canAccess(requiredRole || [], requiredModule)) {
    if (fallback) return <>{fallback}</>;
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
}

/**
 * Admin Only Route Component
 */
export function AdminOnlyRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="admin" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Staff Only Route Component (Admin, Secretary, Doctor)
 */
export function StaffOnlyRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole={["admin", "secretary", "doctor"]} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Doctor Only Route Component
 */
export function DoctorOnlyRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="doctor" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Secretary Only Route Component
 */
export function SecretaryOnlyRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="secretary" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

/**
 * Patient Only Route Component
 */
export function PatientOnlyRoute({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="patient" fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}
