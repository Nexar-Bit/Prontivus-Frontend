"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  Plus, Search, Filter, Edit, Trash2, Eye, 
  Building2, Users, Calendar, AlertTriangle,
  CheckCircle, XCircle, Clock
} from "lucide-react";
import { adminApi, Clinic, ClinicCreate, ClinicUpdate, ClinicLicenseUpdate, ClinicStats } from "@/lib/admin-api";

const AVAILABLE_MODULES = [
  { id: "bi", name: "Business Intelligence", description: "Analytics and reporting" },
  { id: "telemed", name: "Telemedicine", description: "Remote consultations" },
  { id: "stock", name: "Stock Management", description: "Inventory management" },
  { id: "financial", name: "Financial Management", description: "Billing and invoicing" },
  { id: "clinical", name: "Clinical Records", description: "Patient medical records" },
  { id: "appointments", name: "Appointment Management", description: "Scheduling system" },
  { id: "patients", name: "Patient Management", description: "Patient registration" },
  { id: "procedures", name: "Procedure Management", description: "Medical procedures" },
  { id: "tiss", name: "TISS Integration", description: "Health insurance integration" },
  { id: "mobile", name: "Mobile App Access", description: "Mobile application access" },
];

export default function AdminClinicsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [stats, setStats] = useState<ClinicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLicenseDialogOpen, setIsLicenseDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState<ClinicCreate>({
    name: "",
    legal_name: "",
    tax_id: "",
    address: "",
    phone: "",
    email: "",
    is_active: true,
    max_users: 10,
    active_modules: [],
  });
  
  const [editForm, setEditForm] = useState<ClinicUpdate>({});
  const [licenseForm, setLicenseForm] = useState<ClinicLicenseUpdate>({});

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
      loadData();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [clinicsData, statsData] = await Promise.all([
        adminApi.getClinics(),
        adminApi.getClinicStats(),
      ]);
      
      setClinics(clinicsData);
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load clinics data:", error);
      toast.error("Failed to load clinics data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClinic = async () => {
    try {
      const newClinic = await adminApi.createClinic(createForm);
      setClinics([newClinic, ...clinics]);
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: "",
        legal_name: "",
        tax_id: "",
        address: "",
        phone: "",
        email: "",
        is_active: true,
        max_users: 10,
        active_modules: [],
      });
      toast.success("Clinic created successfully");
    } catch (error: any) {
      console.error("Failed to create clinic:", error);
      toast.error(error.response?.data?.detail || "Failed to create clinic");
    }
  };

  const handleUpdateClinic = async () => {
    if (!selectedClinic) return;
    
    try {
      const updatedClinic = await adminApi.updateClinic(selectedClinic.id, editForm);
      setClinics(clinics.map(c => c.id === selectedClinic.id ? updatedClinic : c));
      setIsEditDialogOpen(false);
      setSelectedClinic(null);
      setEditForm({});
      toast.success("Clinic updated successfully");
    } catch (error: any) {
      console.error("Failed to update clinic:", error);
      toast.error(error.response?.data?.detail || "Failed to update clinic");
    }
  };

  const handleUpdateLicense = async () => {
    if (!selectedClinic) return;
    
    try {
      const updatedClinic = await adminApi.updateClinicLicense(selectedClinic.id, licenseForm);
      setClinics(clinics.map(c => c.id === selectedClinic.id ? updatedClinic : c));
      setIsLicenseDialogOpen(false);
      setSelectedClinic(null);
      setLicenseForm({});
      toast.success("Clinic license updated successfully");
    } catch (error: any) {
      console.error("Failed to update license:", error);
      toast.error(error.response?.data?.detail || "Failed to update license");
    }
  };

  const handleDeleteClinic = async (clinic: Clinic) => {
    if (!confirm(`Are you sure you want to deactivate ${clinic.name}?`)) return;
    
    try {
      await adminApi.deleteClinic(clinic.id);
      setClinics(clinics.map(c => c.id === clinic.id ? { ...c, is_active: false } : c));
      toast.success("Clinic deactivated successfully");
    } catch (error: any) {
      console.error("Failed to delete clinic:", error);
      toast.error(error.response?.data?.detail || "Failed to delete clinic");
    }
  };

  const openEditDialog = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setEditForm({
      name: clinic.name,
      legal_name: clinic.legal_name,
      tax_id: clinic.tax_id,
      address: clinic.address || "",
      phone: clinic.phone || "",
      email: clinic.email || "",
      is_active: clinic.is_active,
      max_users: clinic.max_users,
      active_modules: clinic.active_modules,
    });
    setIsEditDialogOpen(true);
  };

  const openLicenseDialog = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    setLicenseForm({
      license_key: clinic.license_key || "",
      expiration_date: clinic.expiration_date || "",
      max_users: clinic.max_users,
      active_modules: clinic.active_modules,
    });
    setIsLicenseDialogOpen(true);
  };

  const toggleModule = (moduleId: string, form: any, setForm: any) => {
    const currentModules = form.active_modules || [];
    const newModules = currentModules.includes(moduleId)
      ? currentModules.filter((m: string) => m !== moduleId)
      : [...currentModules, moduleId];
    setForm({ ...form, active_modules: newModules });
  };

  const filteredClinics = clinics.filter(clinic => {
    const matchesSearch = !searchTerm || 
      clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinic.tax_id.includes(searchTerm) ||
      (clinic.email && clinic.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && clinic.is_active) ||
      (statusFilter === "inactive" && !clinic.is_active);
    
    const matchesLicense = licenseFilter === "all" ||
      (licenseFilter === "expired" && clinic.expiration_date && new Date(clinic.expiration_date) < new Date()) ||
      (licenseFilter === "valid" && (!clinic.expiration_date || new Date(clinic.expiration_date) >= new Date()));
    
    return matchesSearch && matchesStatus && matchesLicense;
  });

  const getLicenseStatus = (clinic: Clinic) => {
    if (!clinic.expiration_date) return { status: "unlimited", color: "default" };
    
    const expirationDate = new Date(clinic.expiration_date);
    const today = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return { status: "expired", color: "destructive" };
    if (daysUntilExpiration <= 30) return { status: "expiring", color: "destructive" };
    return { status: "valid", color: "default" };
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
          <h1 className="text-3xl font-bold">Clinic Management</h1>
          <p className="text-muted-foreground">Manage clinic licenses and access</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Clinic
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Clinic</DialogTitle>
              <DialogDescription>
                Add a new clinic to the system with license and module configuration
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Clinic Name</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Enter clinic name"
                  />
                </div>
                <div>
                  <Label htmlFor="legal_name">Legal Name</Label>
                  <Input
                    id="legal_name"
                    value={createForm.legal_name}
                    onChange={(e) => setCreateForm({ ...createForm, legal_name: e.target.value })}
                    placeholder="Enter legal name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tax_id">Tax ID</Label>
                  <Input
                    id="tax_id"
                    value={createForm.tax_id}
                    onChange={(e) => setCreateForm({ ...createForm, tax_id: e.target.value })}
                    placeholder="Enter tax ID"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={createForm.address}
                  onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="Enter phone"
                  />
                </div>
                <div>
                  <Label htmlFor="max_users">Max Users</Label>
                  <Input
                    id="max_users"
                    type="number"
                    value={createForm.max_users}
                    onChange={(e) => setCreateForm({ ...createForm, max_users: parseInt(e.target.value) || 10 })}
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
              <div>
                <Label>Active Modules</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_MODULES.map((module) => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`create-${module.id}`}
                        checked={createForm.active_modules?.includes(module.id) || false}
                        onCheckedChange={() => toggleModule(module.id, createForm, setCreateForm)}
                      />
                      <Label htmlFor={`create-${module.id}`} className="text-sm">
                        {module.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClinic}>Create Clinic</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Total Clinics</p>
                  <p className="text-2xl font-bold">{stats.total_clinics}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Active Clinics</p>
                  <p className="text-2xl font-bold">{stats.active_clinics}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Expired Licenses</p>
                  <p className="text-2xl font-bold">{stats.expired_licenses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Near Expiration</p>
                  <p className="text-2xl font-bold">{stats.clinics_near_expiration}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search clinics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={licenseFilter} onValueChange={setLicenseFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="License" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Licenses</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clinics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clinics ({filteredClinics.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredClinics.map((clinic) => {
              const licenseStatus = getLicenseStatus(clinic);
              return (
                <div key={clinic.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{clinic.name}</h3>
                        <Badge variant={clinic.is_active ? "default" : "secondary"}>
                          {clinic.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant={licenseStatus.color as any}>
                          {licenseStatus.status === "expired" && <XCircle className="w-3 h-3 mr-1" />}
                          {licenseStatus.status === "expiring" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {licenseStatus.status === "valid" && <CheckCircle className="w-3 h-3 mr-1" />}
                          {licenseStatus.status === "unlimited" && <Clock className="w-3 h-3 mr-1" />}
                          {licenseStatus.status === "expired" ? "Expired" : 
                           licenseStatus.status === "expiring" ? "Expiring Soon" :
                           licenseStatus.status === "unlimited" ? "Unlimited" : "Valid"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{clinic.legal_name}</p>
                      <p className="text-sm text-muted-foreground">Tax ID: {clinic.tax_id}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Users: {clinic.user_count || 0}/{clinic.max_users}</span>
                        <span>Modules: {clinic.active_modules.length}</span>
                        {clinic.expiration_date && (
                          <span>Expires: {new Date(clinic.expiration_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(clinic)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLicenseDialog(clinic)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        License
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClinic(clinic)}
                        disabled={!clinic.is_active}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Clinic</DialogTitle>
            <DialogDescription>
              Update the clinic information and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Clinic Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-legal_name">Legal Name</Label>
                <Input
                  id="edit-legal_name"
                  value={editForm.legal_name || ""}
                  onChange={(e) => setEditForm({ ...editForm, legal_name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-tax_id">Tax ID</Label>
                <Input
                  id="edit-tax_id"
                  value={editForm.tax_id || ""}
                  onChange={(e) => setEditForm({ ...editForm, tax_id: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email || ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Textarea
                id="edit-address"
                value={editForm.address || ""}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone || ""}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-max_users">Max Users</Label>
                <Input
                  id="edit-max_users"
                  type="number"
                  value={editForm.max_users || 10}
                  onChange={(e) => setEditForm({ ...editForm, max_users: parseInt(e.target.value) || 10 })}
                  min="1"
                  max="1000"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is_active"
                checked={editForm.is_active || false}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: !!checked })}
              />
              <Label htmlFor="edit-is_active">Active</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateClinic}>Update Clinic</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* License Dialog */}
      <Dialog open={isLicenseDialogOpen} onOpenChange={setIsLicenseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update License</DialogTitle>
            <DialogDescription>
              Update the clinic's license information and active modules
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license-key">License Key</Label>
                <Input
                  id="license-key"
                  value={licenseForm.license_key || ""}
                  onChange={(e) => setLicenseForm({ ...licenseForm, license_key: e.target.value })}
                  placeholder="Enter license key"
                />
              </div>
              <div>
                <Label htmlFor="expiration-date">Expiration Date</Label>
                <Input
                  id="expiration-date"
                  type="date"
                  value={licenseForm.expiration_date || ""}
                  onChange={(e) => setLicenseForm({ ...licenseForm, expiration_date: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="license-max_users">Max Users</Label>
              <Input
                id="license-max_users"
                type="number"
                value={licenseForm.max_users || 10}
                onChange={(e) => setLicenseForm({ ...licenseForm, max_users: parseInt(e.target.value) || 10 })}
                min="1"
                max="1000"
              />
            </div>
            <div>
              <Label>Active Modules</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {AVAILABLE_MODULES.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`license-${module.id}`}
                      checked={licenseForm.active_modules?.includes(module.id) || false}
                      onCheckedChange={() => toggleModule(module.id, licenseForm, setLicenseForm)}
                    />
                    <Label htmlFor={`license-${module.id}`} className="text-sm">
                      {module.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsLicenseDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateLicense}>Update License</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
