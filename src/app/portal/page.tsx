"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Video,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Appointment {
  id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  status: string;
  appointment_type: string;
  notes: string;
  doctor: {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
  };
}

export default function PortalDashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Cache busting
  const cacheBuster = Math.random();
  const version = Date.now();
  console.log("🔥 CACHE BUSTER:", cacheBuster);
  console.log("🔥 VERSION:", version);
  console.log("🔥 FORCE RELOAD - ROLE FIX APPLIED 🔥");
  console.log("🔥🔥🔥 CRITICAL DEBUG - CHECKING USER ROLE 🔥🔥🔥");
  console.log("User object:", user);
  console.log("User role:", user?.role);
  console.log("User role type:", typeof user?.role);
  console.log("Is user a patient?", user?.role === 'patient');
  console.log("🔥🔥🔥 END CRITICAL DEBUG 🔥🔥🔥");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/portal/login");
      return;
    }
    // Redirect patients to new dashboard
    if (user && user.role === 'patient') {
      router.push("/patient/dashboard");
      return;
    }
    if (user) {
      loadAppointments();
    }
  }, [isAuthenticated, user, router]);

  const loadAppointments = async () => {
    try {
      console.log("🔥🔥🔥 LOADING APPOINTMENTS - CACHE BUSTED 🔥🔥🔥");
      console.log("Loading appointments...");
      console.log("User:", user);
      console.log("User role:", user?.role);
      console.log("User role type:", typeof user?.role);
      console.log("Is authenticated:", isAuthenticated);
      console.log("Timestamp:", new Date().toISOString());
      console.log("🔥🔥🔥 END DEBUG INFO 🔥🔥🔥");
      
      // CRITICAL: Show the actual user object structure
      console.log("🔍 FULL USER OBJECT:", JSON.stringify(user, null, 2));
      
      // Additional debugging for role checking
      console.log("=== ROLE DEBUGGING ===");
      console.log("user?.role === 'patient':", user?.role === 'patient');
      console.log("user?.role === UserRole.PATIENT:", user?.role === 'patient');
      console.log("user?.role value:", JSON.stringify(user?.role));
      console.log("Available roles: admin, secretary, doctor, patient");
      console.log("=== END ROLE DEBUGGING ===");
      
      // Wait for user to be loaded if not available yet
      if (!user) {
        console.log("User not loaded yet, skipping appointments load");
        return;
      }

      let response;
      console.log("Checking user role...");
      console.log("user.role === 'patient':", user.role === 'patient');
      console.log("user.role value:", JSON.stringify(user.role));
      console.log("user.role === UserRole.PATIENT:", user.role === 'patient');
      console.log("Available roles: admin, secretary, doctor, patient");
      
      // More robust role checking
      const isPatient = user.role === 'patient';
      console.log(`Final role check - isPatient: ${isPatient}, role: ${user.role}`);
      console.log(`🔥 CRITICAL: User role is "${user.role}", isPatient = ${isPatient}`);
      
      if (isPatient) {
        // For patients, use the patient-appointments endpoint
        console.log("🔥 Using PATIENT endpoint: /api/appointments/patient-appointments");
        response = await api.get(`/api/appointments/patient-appointments?v=${version}&cb=${cacheBuster}`);
      } else {
        // For staff (admin, secretary, doctor), use the general appointments endpoint
        // with patient_id filter to get appointments for the current user
        console.log(`🔥 Using STAFF endpoint: /api/appointments?patient_id=${user.id}`);
        console.log(`User role is: ${user.role}, not patient`);
        response = await api.get(`/api/appointments?patient_id=${user.id}&v=${version}&cb=${cacheBuster}`);
      }
      
      console.log("Appointments response:", response);
      setAppointments((response as any).data || []);
    } catch (err: any) {
      console.error("Failed to load appointments:", err);
      console.error("Error details:", err.response);
      setError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: "secondary" as const, label: "Scheduled" },
      checked_in: { variant: "default" as const, label: "Checked In" },
      in_consultation: { variant: "default" as const, label: "In Consultation" },
      completed: { variant: "default" as const, label: "Completed" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getUpcomingAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_datetime);
      return aptDate >= now && ['scheduled', 'checked_in', 'in_consultation'].includes(apt.status);
    }).sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime());
  };

  const getRecentAppointments = () => {
    const now = new Date();
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_datetime);
      return aptDate < now && apt.status === 'completed';
    }).sort((a, b) => new Date(b.scheduled_datetime).getTime() - new Date(a.scheduled_datetime).getTime()).slice(0, 3);
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

  const upcomingAppointments = getUpcomingAppointments();
  const recentAppointments = getRecentAppointments();

  return (
    <div className="space-y-6">
      {/* Cache busting meta tags */}
      <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
      <meta httpEquiv="Pragma" content="no-cache" />
      <meta httpEquiv="Expires" content="0" />
      
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.first_name}!
        </h1>
        <p className="text-blue-100">
          Manage your healthcare appointments and consultations from one place.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/portal/appointments")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Book Appointment</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming appointments
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/portal/consultations")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Video Consultations</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Active consultations
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/portal/profile")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-muted-foreground">
              Profile complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>
              Your scheduled appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                <Button onClick={() => router.push("/portal/appointments")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">
                          Dr. {appointment.doctor.full_name}
                        </span>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(appointment.scheduled_datetime), "PPP 'at' p", { locale: ptBR })}
                        </span>
                      </div>
                      {appointment.appointment_type && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {appointment.appointment_type}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/portal/consultation/${appointment.id}`)}
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                  </div>
                ))}
                {upcomingAppointments.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => router.push("/portal/appointments")}
                  >
                    View All Appointments
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Appointments
            </CardTitle>
            <CardDescription>
              Your completed appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Stethoscope className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          Dr. {appointment.doctor.full_name}
                        </span>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(appointment.scheduled_datetime), "PPP 'at' p", { locale: ptBR })}
                        </span>
                      </div>
                      {appointment.appointment_type && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {appointment.appointment_type}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
