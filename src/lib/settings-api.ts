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
    avatar?: string;
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
  return api.get<UserSettings>('/api/v1/settings/me');
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

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change user password
 */
export async function changePassword(
  passwordData: PasswordChange
): Promise<void> {
  return api.post<void>('/api/settings/me/change-password', passwordData);
}

/**
 * Send a test email notification
 */
export async function testEmailNotification(): Promise<{
  message: string;
  email_sent: boolean;
  email_enabled: boolean;
  email_address?: string;
}> {
  return api.post<{
    message: string;
    email_sent: boolean;
    email_enabled: boolean;
    email_address?: string;
  }>('/api/settings/me/test-email');
}

/**
 * Send a test push notification
 */
export async function testPushNotification(): Promise<{
  message: string;
  push_sent: boolean;
  push_enabled: boolean;
  devices_notified?: number;
}> {
  return api.post<{
    message: string;
    push_sent: boolean;
    push_enabled: boolean;
    devices_notified?: number;
  }>('/api/settings/me/test-push');
}

/**
 * Get VAPID public key for push notifications
 */
export async function getPushPublicKey(): Promise<string> {
  const response = await api.get<{ publicKey: string }>('/api/settings/me/push-public-key');
  return response.publicKey;
}

/**
 * Send a test SMS notification
 */
export async function testSmsNotification(): Promise<{
  message: string;
  sms_sent: boolean;
  sms_enabled: boolean;
  phone_number?: string;
}> {
  return api.post<{
    message: string;
    sms_sent: boolean;
    sms_enabled: boolean;
    phone_number?: string;
  }>('/api/settings/me/test-sms');
}

/**
 * Send a test appointment reminder notification
 */
export async function testAppointmentReminder(): Promise<{
  message: string;
  sent: boolean;
  enabled: boolean;
  channels?: string[];
  results?: any;
}> {
  return api.post<{
    message: string;
    sent: boolean;
    enabled: boolean;
    channels?: string[];
    results?: any;
  }>('/api/settings/me/test-appointment-reminder');
}

/**
 * Send a test system update notification
 */
export async function testSystemUpdate(): Promise<{
  message: string;
  sent: boolean;
  enabled: boolean;
  channels?: string[];
  results?: any;
}> {
  return api.post<{
    message: string;
    sent: boolean;
    enabled: boolean;
    channels?: string[];
    results?: any;
  }>('/api/settings/me/test-system-update');
}

/**
 * Send a test marketing notification
 */
export async function testMarketingNotification(): Promise<{
  message: string;
  sent: boolean;
  enabled: boolean;
  channels?: string[];
  results?: any;
}> {
  return api.post<{
    message: string;
    sent: boolean;
    enabled: boolean;
    channels?: string[];
    results?: any;
  }>('/api/settings/me/test-marketing');
}

/**
 * Test privacy settings functionality
 */
export async function testPrivacySettings(): Promise<{
  message: string;
  settings: any;
  test_results: any;
}> {
  return api.post<{
    message: string;
    settings: any;
    test_results: any;
  }>('/api/settings/me/test-privacy');
}

/**
 * Setup Two Factor Authentication
 */
export async function setup2FA(): Promise<{
  message: string;
  secret: string;
  qr_uri: string;
  qr_image: string;
}> {
  return api.post<{
    message: string;
    secret: string;
    qr_uri: string;
    qr_image: string;
  }>('/api/settings/me/2fa/setup');
}

/**
 * Verify 2FA code and enable 2FA
 */
export async function verify2FA(code: string): Promise<{
  message: string;
  enabled: boolean;
}> {
  return api.post<{
    message: string;
    enabled: boolean;
  }>('/api/settings/me/2fa/verify', { code });
}

/**
 * Disable Two Factor Authentication
 */
export async function disable2FA(): Promise<{
  message: string;
  enabled: boolean;
}> {
  return api.post<{
    message: string;
    enabled: boolean;
  }>('/api/settings/me/2fa/disable');
}

/**
 * Get 2FA status
 */
export async function get2FAStatus(): Promise<{
  enabled: boolean;
}> {
  return api.get<{
    enabled: boolean;
  }>('/api/settings/me/2fa/status');
}

/**
 * Test login alert
 */
export async function testLoginAlert(): Promise<{
  message: string;
  sent: boolean;
  enabled: boolean;
}> {
  return api.post<{
    message: string;
    sent: boolean;
    enabled: boolean;
  }>('/api/settings/me/test-login-alert');
}

