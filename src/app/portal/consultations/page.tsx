"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  Clock,
  User,
  Stethoscope,
  Phone,
  Calendar,
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

export default function ConsultationsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/portal/login");
      return;
    }
    if (user) {
      loadAppointments();
    }
  }, [isAuthenticated, user, router]);

  const loadAppointments = async () => {
    try {
      console.log("Loading consultations...");
      console.log("User:", user);
      console.log("User role:", user?.role);
      
      // Wait for user to be loaded if not available yet
      if (!user) {
        console.log("User not loaded yet, skipping consultations load");
        return;
      }
      
      let response;
      const isPatient = user.role === 'patient';
      console.log(`Role check - isPatient: ${isPatient}, role: ${user.role}`);
      
      if (isPatient) {
        // For patients, use the patient-appointments endpoint
        console.log("Using patient endpoint: /api/appointments/patient-appointments");
        response = await api.get("/api/appointments/patient-appointments");
      } else {
        // For staff (admin, secretary, doctor), use the general appointments endpoint
        // with patient_id filter to get appointments for the current user
        console.log(`Using staff endpoint: /api/appointments?patient_id=${user.id}`);
        response = await api.get(`/api/appointments?patient_id=${user.id}`);
      }
      setAppointments((response as any).data || []);
    } catch (err: any) {
      console.error("Failed to load appointments:", err);
      setError("Failed to load consultations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { variant: "secondary" as const, label: "Scheduled" },
      checked_in: { variant: "default" as const, label: "Ready to Join" },
      in_consultation: { variant: "default" as const, label: "In Progress" },
      completed: { variant: "default" as const, label: "Completed" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { variant: "secondary" as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canJoinConsultation = (appointment: Appointment) => {
    const now = new Date();
    const appointmentTime = new Date(appointment.scheduled_datetime);
    const timeDiff = appointmentTime.getTime() - now.getTime();
    const minutesUntilAppointment = timeDiff / (1000 * 60);
    
    // Can join 10 minutes before scheduled time or if already in consultation
    return minutesUntilAppointment <= 10 || appointment.status === 'in_consultation';
  };

  const getJoinButtonText = (appointment: Appointment) => {
    if (appointment.status === 'in_consultation') {
      return 'Rejoin Consultation';
    }
    if (appointment.status === 'checked_in') {
      return 'Join Now';
    }
    return 'Join Consultation';
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

  const upcomingConsultations = appointments.filter(apt => 
    ['scheduled', 'checked_in', 'in_consultation'].includes(apt.status)
  ).sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Video Consultations</h1>
        <p className="text-muted-foreground">
          Join your scheduled video consultations with healthcare providers
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upcoming Consultations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Upcoming Consultations
          </CardTitle>
          <CardDescription>
            Your scheduled video consultations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingConsultations.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No upcoming consultations</p>
              <Button onClick={() => router.push("/portal/appointments")}>
                <Calendar className="mr-2 h-4 w-4" />
                Book Consultation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingConsultations.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="h-5 w-5 text-blue-600" />
                      <span className="text-lg font-semibold">
                        Dr. {appointment.doctor.full_name}
                      </span>
                      {getStatusBadge(appointment.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(new Date(appointment.scheduled_datetime), "PPP 'at' p", { locale: ptBR })}
                      </span>
                    </div>
                    {appointment.appointment_type && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Type:</strong> {appointment.appointment_type}
                      </p>
                    )}
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {appointment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="lg"
                      onClick={() => router.push(`/portal/consultation/${appointment.id}`)}
                      disabled={!canJoinConsultation(appointment)}
                      className="min-w-[140px]"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      {getJoinButtonText(appointment)}
                    </Button>
                    {!canJoinConsultation(appointment) && (
                      <p className="text-xs text-muted-foreground text-center">
                        Available 10 minutes before scheduled time
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Need Help?
          </CardTitle>
          <CardDescription>
            Having trouble with your video consultation?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Before Your Consultation</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Test your camera and microphone</li>
                <li>• Ensure you have a stable internet connection</li>
                <li>• Find a quiet, well-lit location</li>
                <li>• Have your ID ready for verification</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Technical Support</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check your browser permissions</li>
                <li>• Try refreshing the page</li>
                <li>• Contact support if issues persist</li>
                <li>• Emergency: Call (555) 123-4567</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
