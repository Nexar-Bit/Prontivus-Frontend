/**
 * User Settings API client
 * Handles user preferences and settings management
 */
import { api } from './api';

export interface UserSettings {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    appointmentReminders: boolean;
    systemUpdates: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'contacts';
    showOnlineStatus: boolean;
    allowDirectMessages: boolean;
    dataSharing: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
  };
  security: {
    twoFactorAuth: boolean;
    loginAlerts: boolean;
    sessionTimeout: number;
    passwordExpiry: number;
  };
}

export interface UserSettingsUpdate {
  phone?: string;
  notifications?: Partial<UserSettings['notifications']>;
  privacy?: Partial<UserSettings['privacy']>;
  appearance?: Partial<UserSettings['appearance']>;
  security?: Partial<UserSettings['security']>;
}

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

/**
 * Get current user's settings from the backend
 */
export async function getUserSettings(): Promise<UserSettings> {
  return api.get<UserSettings>('/api/settings/me');
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  settings: UserSettingsUpdate
): Promise<void> {
  return api.put<void>('/api/settings/me', settings);
}

/**
 * Update user profile (first name, last name, email, phone)
 */
export async function updateUserProfile(
  profile: ProfileUpdate
): Promise<void> {
  return api.post<void>('/api/settings/me/profile', profile);
}

