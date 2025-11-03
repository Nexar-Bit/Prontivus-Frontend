/**
 * Permission-based Button Component
 * Shows/hides buttons based on user permissions
 */

import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/hooks/usePermissions';

interface PermissionButtonProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredModule?: string;
  fallback?: React.ReactNode;
  className?: string;
}

export function PermissionButton({
  children,
  requiredRole,
  requiredModule,
  fallback = null,
  className
}: PermissionButtonProps) {
  const { canAccess } = usePermissions();

  if (!canAccess(requiredRole || [], requiredModule)) {
    return <>{fallback}</>;
  }

  return <div className={className}>{children}</div>;
}

/**
 * Admin Only Button
 */
export function AdminOnlyButton({ children, fallback, className }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  className?: string;
}) {
  return (
    <PermissionButton requiredRole="admin" fallback={fallback} className={className}>
      {children}
    </PermissionButton>
  );
}

/**
 * Staff Only Button (Admin, Secretary, Doctor)
 */
export function StaffOnlyButton({ children, fallback, className }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  className?: string;
}) {
  return (
    <PermissionButton requiredRole={["admin", "secretary", "doctor"]} fallback={fallback} className={className}>
      {children}
    </PermissionButton>
  );
}

/**
 * Doctor Only Button
 */
export function DoctorOnlyButton({ children, fallback, className }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  className?: string;
}) {
  return (
    <PermissionButton requiredRole="doctor" fallback={fallback} className={className}>
      {children}
    </PermissionButton>
  );
}

/**
 * Secretary Only Button
 */
export function SecretaryOnlyButton({ children, fallback, className }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  className?: string;
}) {
  return (
    <PermissionButton requiredRole="secretary" fallback={fallback} className={className}>
      {children}
    </PermissionButton>
  );
}

/**
 * Financial Module Button
 */
export function FinancialButton({ children, fallback, className }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  className?: string;
}) {
  return (
    <PermissionButton requiredRole={["admin", "secretary"]} requiredModule="financial" fallback={fallback} className={className}>
      {children}
    </PermissionButton>
  );
}

/**
 * Clinical Module Button
 */
export function ClinicalButton({ children, fallback, className }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  className?: string;
}) {
  return (
    <PermissionButton requiredRole={["admin", "secretary", "doctor"]} requiredModule="clinical" fallback={fallback} className={className}>
      {children}
    </PermissionButton>
  );
}

/**
 * BI Module Button
 */
export function BIButton({ children, fallback, className }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  className?: string;
}) {
  return (
    <PermissionButton requiredRole={["admin", "secretary", "doctor"]} requiredModule="bi" fallback={fallback} className={className}>
      {children}
    </PermissionButton>
  );
}

/**
 * Stock Module Button
 */
export function StockButton({ children, fallback, className }: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode; 
  className?: string;
}) {
  return (
    <PermissionButton requiredRole={["admin", "secretary"]} requiredModule="stock" fallback={fallback} className={className}>
      {children}
    </PermissionButton>
  );
}
