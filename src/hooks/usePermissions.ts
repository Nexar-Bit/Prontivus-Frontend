/**
 * Role-based permissions hook
 * Provides utilities for checking user permissions and role-based access control
 */

import { useAuth } from '@/contexts/AuthContext';

export const ROLES = {
  ADMIN: 'admin',
  SECRETARY: 'secretary',
  DOCTOR: 'doctor',
  PATIENT: 'patient'
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES];

export function usePermissions() {
  const { user } = useAuth();

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role as UserRole);
    }
    
    return user.role === role;
  };

  /**
   * Check if user has access to a specific module
   */
  const hasModuleAccess = (module: string): boolean => {
    if (!user?.clinic?.active_modules) return false;
    return user.clinic.active_modules.includes(module);
  };

  /**
   * Check if user can access a specific page/feature
   */
  const canAccess = (requiredRole: UserRole | UserRole[], requiredModule?: string): boolean => {
    if (!hasRole(requiredRole)) return false;
    
    if (requiredModule && !hasModuleAccess(requiredModule)) return false;
    
    return true;
  };

  /**
   * Check if user is admin
   */
  const isAdmin = (): boolean => hasRole(ROLES.ADMIN);

  /**
   * Check if user is secretary
   */
  const isSecretary = (): boolean => hasRole(ROLES.SECRETARY);

  /**
   * Check if user is doctor
   */
  const isDoctor = (): boolean => hasRole(ROLES.DOCTOR);

  /**
   * Check if user is patient
   */
  const isPatient = (): boolean => hasRole(ROLES.PATIENT);

  /**
   * Check if user is staff (admin, secretary, or doctor)
   */
  const isStaff = (): boolean => hasRole([ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR]);

  /**
   * Get user's role display name
   */
  const getRoleDisplayName = (): string => {
    if (!user) return '';
    
    const roleNames = {
      [ROLES.ADMIN]: 'Administrador',
      [ROLES.SECRETARY]: 'Secretária',
      [ROLES.DOCTOR]: 'Médico',
      [ROLES.PATIENT]: 'Paciente'
    };
    
    return roleNames[user.role as UserRole] || user.role;
  };

  /**
   * Get all active modules for the user's clinic
   */
  const getActiveModules = (): string[] => {
    return user?.clinic?.active_modules || [];
  };

  /**
   * Check if user can manage users
   */
  const canManageUsers = (): boolean => {
    return isAdmin();
  };

  /**
   * Check if user can manage clinics
   */
  const canManageClinics = (): boolean => {
    return isAdmin();
  };

  /**
   * Check if user can access financial features
   */
  const canAccessFinancial = (): boolean => {
    return canAccess([ROLES.ADMIN, ROLES.SECRETARY], 'financial');
  };

  /**
   * Check if user can access clinical features
   */
  const canAccessClinical = (): boolean => {
    return canAccess([ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR], 'clinical');
  };

  /**
   * Check if user can access appointments
   */
  const canAccessAppointments = (): boolean => {
    return canAccess([ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR, ROLES.PATIENT], 'appointments');
  };

  /**
   * Check if user can access patients
   */
  const canAccessPatients = (): boolean => {
    return canAccess([ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR], 'patients');
  };

  /**
   * Check if user can access reports
   */
  const canAccessReports = (): boolean => {
    return canAccess([ROLES.ADMIN, ROLES.SECRETARY, ROLES.DOCTOR], 'bi');
  };

  /**
   * Check if user can access inventory
   */
  const canAccessInventory = (): boolean => {
    return canAccess([ROLES.ADMIN, ROLES.SECRETARY], 'stock');
  };

  return {
    user,
    hasRole,
    hasModuleAccess,
    canAccess,
    isAdmin,
    isSecretary,
    isDoctor,
    isPatient,
    isStaff,
    getRoleDisplayName,
    getActiveModules,
    canManageUsers,
    canManageClinics,
    canAccessFinancial,
    canAccessClinical,
    canAccessAppointments,
    canAccessPatients,
    canAccessReports,
    canAccessInventory,
  };
}
