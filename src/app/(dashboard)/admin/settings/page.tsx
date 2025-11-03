"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Database, 
  Shield, 
  Mail, 
  Bell, 
  Globe,
  Lock,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface SystemSettings {
  // General Settings
  clinicName: string;
  clinicEmail: string;
  clinicPhone: string;
  clinicAddress: string;
  timezone: string;
  language: string;
  
  // Security Settings
  passwordMinLength: number;
  requireTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  
  // Notification Settings
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationEmail: string;
  
  // System Settings
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  logRetentionDays: number;
  
  // License Settings
  licenseKey: string;
  maxUsers: number;
  activeModules: string[];
}

const AVAILABLE_MODULES = [
  { id: "patients", name: "Patient Management", description: "Patient registration and management" },
  { id: "appointments", name: "Appointment Management", description: "Scheduling and appointment system" },
  { id: "clinical", name: "Clinical Records", description: "Medical records and SOAP notes" },
  { id: "financial", name: "Financial Management", description: "Billing and invoicing" },
  { id: "stock", name: "Stock Management", description: "Inventory management" },
  { id: "bi", name: "Business Intelligence", description: "Analytics and reporting" },
  { id: "procedures", name: "Procedure Management", description: "Medical procedures" },
  { id: "tiss", name: "TISS Integration", description: "Health insurance integration" },
  { id: "mobile", name: "Mobile App Access", description: "Mobile application access" },
  { id: "telemed", name: "Telemedicine", description: "Remote consultations" },
];

const TIMEZONES = [
  "America/Sao_Paulo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "UTC"
];

const LANGUAGES = [
  { code: "pt-BR", name: "Português (Brasil)" },
  { code: "en-US", name: "English (US)" },
  { code: "es-ES", name: "Español" },
];

const BACKUP_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<SystemSettings>({
    // General Settings
    clinicName: "",
    clinicEmail: "",
    clinicPhone: "",
    clinicAddress: "",
    timezone: "America/Sao_Paulo",
    language: "pt-BR",
    
    // Security Settings
    passwordMinLength: 8,
    requireTwoFactor: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    notificationEmail: "",
    
    // System Settings
    maintenanceMode: false,
    autoBackup: true,
    backupFrequency: "daily",
    logRetentionDays: 90,
    
    // License Settings
    licenseKey: "",
    maxUsers: 10,
    activeModules: ["patients", "appointments", "clinical", "financial"],
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    if (isAuthenticated && user?.role !== "admin") {
      router.push("/unauthorized");
      return;
    }
    
    if (isAuthenticated) {
      loadSettings();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await adminApi.getSettings();
      // setSettings(response);
      
      // Mock data for now
      setTimeout(() => {
        setSettings(prev => ({
          ...prev,
          clinicName: "HealthCare Plus",
          clinicEmail: "contact@healthcareplus.com",
          clinicPhone: "+1 (555) 123-4567",
          clinicAddress: "123 Medical St, Suite 100, Health City, HC 12345",
        }));
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // TODO: Replace with actual API call
      // await adminApi.updateSettings(settings);
      
      // Mock save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHasChanges(false);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleModule = (moduleId: string) => {
    const currentModules = settings.activeModules;
    const newModules = currentModules.includes(moduleId)
      ? currentModules.filter(m => m !== moduleId)
      : [...currentModules, moduleId];
    handleSettingChange("activeModules", newModules);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadSettings}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Basic clinic information and system preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clinicName">Clinic Name</Label>
              <Input
                id="clinicName"
                value={settings.clinicName}
                onChange={(e) => handleSettingChange("clinicName", e.target.value)}
                placeholder="Enter clinic name"
              />
            </div>
            <div>
              <Label htmlFor="clinicEmail">Email</Label>
              <Input
                id="clinicEmail"
                type="email"
                value={settings.clinicEmail}
                onChange={(e) => handleSettingChange("clinicEmail", e.target.value)}
                placeholder="Enter clinic email"
              />
            </div>
            <div>
              <Label htmlFor="clinicPhone">Phone</Label>
              <Input
                id="clinicPhone"
                value={settings.clinicPhone}
                onChange={(e) => handleSettingChange("clinicPhone", e.target.value)}
                placeholder="Enter clinic phone"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => handleSettingChange("timezone", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => handleSettingChange("language", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="clinicAddress">Address</Label>
            <Textarea
              id="clinicAddress"
              value={settings.clinicAddress}
              onChange={(e) => handleSettingChange("clinicAddress", e.target.value)}
              placeholder="Enter clinic address"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Configure security policies and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => handleSettingChange("passwordMinLength", parseInt(e.target.value))}
                min="6"
                max="32"
              />
            </div>
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange("sessionTimeout", parseInt(e.target.value))}
                min="5"
                max="480"
              />
            </div>
            <div>
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange("maxLoginAttempts", parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>
            <div>
              <Label htmlFor="lockoutDuration">Lockout Duration (minutes)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => handleSettingChange("lockoutDuration", parseInt(e.target.value))}
                min="5"
                max="60"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="requireTwoFactor"
              checked={settings.requireTwoFactor}
              onCheckedChange={(checked) => handleSettingChange("requireTwoFactor", checked)}
            />
            <Label htmlFor="requireTwoFactor">Require Two-Factor Authentication</Label>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how users receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
              />
              <Label htmlFor="emailNotifications">Email Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
              />
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="pushNotifications"
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
              />
              <Label htmlFor="pushNotifications">Push Notifications</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="notificationEmail">Notification Email</Label>
            <Input
              id="notificationEmail"
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => handleSettingChange("notificationEmail", e.target.value)}
              placeholder="Enter notification email address"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system maintenance and backup settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
              />
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              {settings.maintenanceMode && (
                <Badge variant="destructive">System in maintenance</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="autoBackup"
                checked={settings.autoBackup}
                onCheckedChange={(checked) => handleSettingChange("autoBackup", checked)}
              />
              <Label htmlFor="autoBackup">Automatic Backup</Label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => handleSettingChange("backupFrequency", value)}
                disabled={!settings.autoBackup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {BACKUP_FREQUENCIES.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="logRetentionDays">Log Retention (days)</Label>
              <Input
                id="logRetentionDays"
                type="number"
                value={settings.logRetentionDays}
                onChange={(e) => handleSettingChange("logRetentionDays", parseInt(e.target.value))}
                min="7"
                max="365"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            License Settings
          </CardTitle>
          <CardDescription>
            Manage license information and active modules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licenseKey">License Key</Label>
              <Input
                id="licenseKey"
                value={settings.licenseKey}
                onChange={(e) => handleSettingChange("licenseKey", e.target.value)}
                placeholder="Enter license key"
              />
            </div>
            <div>
              <Label htmlFor="maxUsers">Maximum Users</Label>
              <Input
                id="maxUsers"
                type="number"
                value={settings.maxUsers}
                onChange={(e) => handleSettingChange("maxUsers", parseInt(e.target.value))}
                min="1"
                max="1000"
              />
            </div>
          </div>
          <div>
            <Label>Active Modules</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {AVAILABLE_MODULES.map((module) => (
                <div key={module.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`module-${module.id}`}
                    checked={settings.activeModules.includes(module.id)}
                    onChange={() => toggleModule(module.id)}
                    className="rounded border-gray-300"
                    aria-label={`Toggle ${module.name} module`}
                  />
                  <Label htmlFor={`module-${module.id}`} className="text-sm">
                    {module.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current system status and health information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Database: Connected</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">API: Running</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Storage: Available</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
