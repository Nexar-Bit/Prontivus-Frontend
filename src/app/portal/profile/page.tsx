"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface PatientProfile {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  cpf: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  blood_type: string;
  allergies: string;
  active_problems: string;
  created_at: string;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<Partial<PatientProfile>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/portal/login");
      return;
    }
    loadProfile();
  }, [isAuthenticated, router]);

  const loadProfile = async () => {
    try {
      const response = await api.get("/api/patients/me");
      setProfile((response as any).data);
      setFormData((response as any).data);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError("Failed to load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    setError("");

    try {
      await api.put("/api/patients/me", formData);
      setProfile({ ...profile, ...formData });
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setError(err.response?.data?.detail || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
  };

  const getGenderLabel = (gender: string) => {
    const genderMap: { [key: string]: string } = {
      male: "Male",
      female: "Female",
      other: "Other",
      prefer_not_to_say: "Prefer not to say",
    };
    return genderMap[gender] || gender;
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Profile not found</p>
        <Button onClick={() => router.push("/portal")} className="mt-4">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and medical details
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your basic personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={editing ? formData.first_name || "" : profile.first_name}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={editing ? formData.last_name || "" : profile.last_name}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editing ? formData.email || "" : profile.email}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={editing ? formData.phone || "" : profile.phone}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={editing ? formData.date_of_birth || "" : profile.date_of_birth}
                  onChange={handleInputChange}
                  disabled={!editing}
                />
                {!editing && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Age: {calculateAge(profile.date_of_birth)} years
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                {editing ? (
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleInputChange}
                    aria-label="Gender selection"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                ) : (
                  <div className="flex h-10 w-full items-center px-3 py-2 text-sm">
                    {getGenderLabel(profile.gender)}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                name="cpf"
                value={editing ? formData.cpf || "" : profile.cpf}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={editing ? formData.address || "" : profile.address}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Emergency Contact
            </CardTitle>
            <CardDescription>
              Contact information for emergencies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                value={editing ? formData.emergency_contact_name || "" : profile.emergency_contact_name}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                type="tel"
                value={editing ? formData.emergency_contact_phone || "" : profile.emergency_contact_phone}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>

            <div>
              <Label htmlFor="emergency_contact_relationship">Relationship</Label>
              <Input
                id="emergency_contact_relationship"
                name="emergency_contact_relationship"
                value={editing ? formData.emergency_contact_relationship || "" : profile.emergency_contact_relationship}
                onChange={handleInputChange}
                disabled={!editing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Medical Information
            </CardTitle>
            <CardDescription>
              Your medical details and history
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="blood_type">Blood Type</Label>
              <Input
                id="blood_type"
                name="blood_type"
                value={editing ? formData.blood_type || "" : profile.blood_type || ""}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="e.g., A+, B-, O+, AB-"
              />
            </div>

            <div>
              <Label htmlFor="allergies">Allergies</Label>
              <textarea
                id="allergies"
                name="allergies"
                value={editing ? formData.allergies || "" : profile.allergies || ""}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="List any known allergies..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <Label htmlFor="active_problems">Active Medical Problems</Label>
              <textarea
                id="active_problems"
                name="active_problems"
                value={editing ? formData.active_problems || "" : profile.active_problems || ""}
                onChange={handleInputChange}
                disabled={!editing}
                placeholder="List any current medical conditions..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
