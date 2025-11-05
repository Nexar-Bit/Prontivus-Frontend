"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
 
import { toast } from "sonner";
import { 
  Settings,
  Save,
  RefreshCw,
  Lock
} from "lucide-react";
import { adminApi } from "@/lib/admin-api";

interface SystemSettings {
  clinicName: string;
  clinicEmail: string;
  clinicPhone: string;
  clinicAddress: string;
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

 

export default function AdminSettingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [settings, setSettings] = useState<SystemSettings>({
    clinicName: "",
    clinicEmail: "",
    clinicPhone: "",
    clinicAddress: "",
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
      // Load current clinic data
      const clinicId = user?.clinic_id;
      if (!clinicId) throw new Error("Missing clinic id");
      const clinic = await adminApi.getClinic(clinicId);
      setSettings(prev => ({
        ...prev,
        clinicName: clinic.name || "",
        clinicEmail: clinic.email || "",
        clinicPhone: clinic.phone || "",
        clinicAddress: clinic.address || "",
        // License
        licenseKey: clinic.license_key || "",
        maxUsers: clinic.max_users || 10,
        activeModules: clinic.active_modules || [],
      }));
      setLoading(false);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast.error("Failed to load settings");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const clinicId = user?.clinic_id;
      if (!clinicId) throw new Error("Missing clinic id");
      await adminApi.updateClinic(clinicId, {
        name: settings.clinicName,
        email: settings.clinicEmail,
        phone: settings.clinicPhone,
        address: settings.clinicAddress,
        license_key: settings.licenseKey,
        max_users: settings.maxUsers,
        active_modules: settings.activeModules,
      });
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

      {/* General Settings (DB-backed) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">General Settings</CardTitle>
          <CardDescription>Basic clinic information</CardDescription>
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
            {/* Removed non-DB-backed timezone and language */}
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

      {/* Removed non-DB-backed Security Settings */}

      {/* Removed non-DB-backed Notification Settings */}

      {/* Removed non-DB-backed System Settings */}

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

      {/* Removed non-DB-backed System Status */}
    </div>
  );
}
