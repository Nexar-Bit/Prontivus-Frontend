"use client";

import React, { useState, useEffect } from "react";
import FeatureGate from "@/components/flags/FeatureGate";
import AppointmentsV2 from "@/components/v2/AppointmentsV2";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Plus,
  Search,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Doctor {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
}

interface Appointment {
  id: number;
  scheduled_datetime: string;
  duration_minutes: number;
  status: string;
  appointment_type: string;
  notes: string;
  doctor: Doctor;
}

interface TimeSlot {
  time: string;
  available: boolean;
  appointment_id?: number;
}

export default function AppointmentsPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const appointmentTypes = [
    "Consultation",
    "Follow-up",
    "Emergency",
    "Telemedicine",
    "Procedure",
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/portal/login");
      return;
    }
    if (user) {
      loadData();
    }
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      console.log("Loading appointments data...");
      console.log("User:", user);
      console.log("User role:", user?.role);
      
      // Wait for user to be loaded if not available yet
      if (!user) {
        console.log("User not loaded yet, skipping data load");
        return;
      }
      
      let appointmentsResponse;
      const isPatient = user.role === 'patient';
      console.log(`Role check - isPatient: ${isPatient}, role: ${user.role}`);
      
        if (isPatient) {
          // For patients, use the patient-appointments endpoint
          console.log("Using patient endpoint: /api/appointments/patient-appointments");
          appointmentsResponse = await api.get("/api/appointments/patient-appointments");
      } else {
        // For staff (admin, secretary, doctor), use the general appointments endpoint
        // with patient_id filter to get appointments for the current user
        console.log(`Using staff endpoint: /api/appointments?patient_id=${user.id}`);
        appointmentsResponse = await api.get(`/api/appointments?patient_id=${user.id}`);
      }
      
      // Only load doctors for patients (who can book appointments)
      // Staff users don't need to load doctors for this page
      if (isPatient) {
        const doctorsResponse = await api.get("/api/users/doctors");
        setDoctors((doctorsResponse as any).data || []);
      } else {
        setDoctors([]); // Staff users don't need doctors list
      }
      
      setAppointments((appointmentsResponse as any).data || []);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadTimeSlots = async (date: string, doctorId: string) => {
    if (!date || !doctorId) return;

    try {
      const response = await api.get(`/api/appointments/available-slots?date=${date}&doctor_id=${doctorId}`);
      setTimeSlots((response as any).data || []);
    } catch (err: any) {
      console.error("Failed to load time slots:", err);
      setError("Failed to load available time slots.");
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedDoctor) {
      loadTimeSlots(date, selectedDoctor);
    }
  };

  const handleDoctorChange = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    if (selectedDate) {
      loadTimeSlots(selectedDate, doctorId);
    }
  };

  const handleBookAppointment = async (timeSlot: string) => {
    if (!selectedDate || !selectedDoctor || !selectedType) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const appointmentData = {
        patient_id: user?.id,
        doctor_id: parseInt(selectedDoctor),
        scheduled_datetime: `${selectedDate}T${timeSlot}:00`,
        duration_minutes: 30,
        appointment_type: selectedType,
        status: "scheduled",
      };

      await api.post("/api/appointments", appointmentData);
      setError("");
      setShowBookingForm(false);
      setSelectedDate("");
      setSelectedDoctor("");
      setSelectedType("");
      setTimeSlots([]);
      loadData(); // Reload appointments
    } catch (err: any) {
      console.error("Failed to book appointment:", err);
      setError(err.response?.data?.detail || "Failed to book appointment. Please try again.");
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
      return aptDate >= now;
    }).sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime());
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

  const legacy = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground">
            Manage your healthcare appointments
          </p>
        </div>
        <Button onClick={() => setShowBookingForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Book Appointment
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <Card className="fixed inset-0 z-50 m-4 max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <CardTitle>Book New Appointment</CardTitle>
            <CardDescription>
              Select a doctor, date, and time for your appointment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Doctor</label>
                <Select value={selectedDoctor} onValueChange={handleDoctorChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        Dr. {doctor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  aria-label="Select appointment date"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {timeSlots.length > 0 && (
              <div>
                <label className="text-sm font-medium mb-2 block">Available Times</label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {timeSlots.map((slot, index) => (
                    <Button
                      key={index}
                      variant={slot.available ? "outline" : "secondary"}
                      disabled={!slot.available}
                      onClick={() => slot.available && handleBookAppointment(slot.time)}
                      className="h-10"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowBookingForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
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
              <Button onClick={() => setShowBookingForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Book Your First Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
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
                    {appointment.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {appointment.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {appointment.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/portal/consultation/${appointment.id}`)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Join
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <FeatureGate name="appointmentsV2" fallback={legacy}>
      <AppointmentsV2 />
    </FeatureGate>
  );
}
