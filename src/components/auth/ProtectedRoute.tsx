"use client";

import * as React from "react";
import { useRequireAuth } from "@/contexts";
import { useRouter, usePathname } from "next/navigation";
import { AccessDenied } from "@/components/layout/AccessDenied";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedRoleIds?: number[];
  allowedRoleNames?: string[];
  requiredPermissions?: string[];
  fallbackRoute?: string;
  showLoading?: boolean;
  customAccessDenied?: React.ReactNode;
}

/**
 * ProtectedRoute Component
 * Wraps routes with role and permission verification
 */
export function ProtectedRoute({
  children,
  allowedRoles = [],
  allowedRoleIds = [],
  allowedRoleNames = [],
  requiredPermissions = [],
  fallbackRoute = "/dashboard",
  showLoading = true,
  customAccessDenied,
}: ProtectedRouteProps) {
  const { user, isLoading } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);
  const [checkingPermissions, setCheckingPermissions] = React.useState(true);

  React.useEffect(() => {
    const checkAccess = async () => {
      if (isLoading) {
        return;
      }

      if (!user) {
        setIsAuthorized(false);
        setCheckingPermissions(false);
        return;
      }

      let authorized = false;

      // Check role-based access
      if (allowedRoles.length > 0 || allowedRoleIds.length > 0 || allowedRoleNames.length > 0) {
        // Check by role enum
        if (allowedRoles.length > 0) {
          authorized = allowedRoles.includes(user.role);
        }

        // Check by role_id
        if (!authorized && allowedRoleIds.length > 0 && user.role_id) {
          authorized = allowedRoleIds.includes(user.role_id);
        }

        // Check by role_name
        if (!authorized && allowedRoleNames.length > 0 && user.role_name) {
          authorized = allowedRoleNames.includes(user.role_name);
        }
      } else {
        // No role restrictions, allow authenticated users
        authorized = true;
      }

      // Check permission-based access
      if (authorized && requiredPermissions.length > 0) {
        // Fetch user permissions from API or context
        try {
            // Try both token key formats for compatibility
            const token = localStorage.getItem('prontivus_access_token') || 
                          localStorage.getItem('clinicore_access_token');
            
            if (!token) {
              authorized = false;
              setCheckingPermissions(false);
              return;
            }

            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/menu/user`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

          if (response.ok) {
            const menuData = await response.json();
            // Extract permissions from menu structure
            const userPermissions: string[] = [];
            if (menuData.groups) {
              menuData.groups.forEach((group: any) => {
                if (group.items) {
                  group.items.forEach((item: any) => {
                    if (item.permissions_required) {
                      userPermissions.push(...item.permissions_required);
                    }
                  });
                }
              });
            }

            // Check if user has all required permissions
            const hasAllPermissions = requiredPermissions.every(permission =>
              userPermissions.includes(permission)
            );

            if (!hasAllPermissions) {
              authorized = false;
            }
          }
        } catch (error) {
          console.error('Error checking permissions:', error);
          // On error, deny access for security
          authorized = false;
        }
      }

      setIsAuthorized(authorized);
      setCheckingPermissions(false);

      if (!authorized) {
        toast.error("Acesso negado. Você não tem permissão para acessar esta área.");
        router.push(fallbackRoute);
      }
    };

    checkAccess();
  }, [
    user,
    isLoading,
    allowedRoles,
    allowedRoleIds,
    allowedRoleNames,
    requiredPermissions,
    fallbackRoute,
    router,
  ]);

  // Show loading state
  if (isLoading || checkingPermissions) {
    if (!showLoading) {
      return null;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect to login via useRequireAuth
  }

  // Not authorized
  if (isAuthorized === false) {
    if (customAccessDenied) {
      return <>{customAccessDenied}</>;
    }

    return (
      <AccessDenied
        title="Acesso Negado"
        message="Você não tem permissão para acessar esta área."
        fallbackRoute={fallbackRoute}
        showBackButton={true}
      />
    );
  }

  // Authorized - render children
  return <>{children}</>;
}

/**
 * Convenience components for specific roles
 */
export function SuperAdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoleIds' | 'allowedRoleNames'>) {
  return (
    <ProtectedRoute
      allowedRoleIds={[1]}
      allowedRoleNames={['SuperAdmin']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function AdminClinicaRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoleIds' | 'allowedRoleNames'>) {
  return (
    <ProtectedRoute
      allowedRoleIds={[2]}
      allowedRoleNames={['AdminClinica']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function MedicoRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoleIds' | 'allowedRoleNames'>) {
  return (
    <ProtectedRoute
      allowedRoleIds={[3]}
      allowedRoleNames={['Medico']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function SecretariaRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoleIds' | 'allowedRoleNames'>) {
  return (
    <ProtectedRoute
      allowedRoleIds={[4]}
      allowedRoleNames={['Secretaria']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function PacienteRoute({ children, ...props }: Omit<ProtectedRouteProps, 'allowedRoleIds' | 'allowedRoleNames'>) {
  return (
    <ProtectedRoute
      allowedRoleIds={[5]}
      allowedRoleNames={['Paciente']}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}
