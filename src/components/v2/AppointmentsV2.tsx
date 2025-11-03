"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, QrCode, RefreshCcw, Stethoscope, Clock, Plus } from "lucide-react";
import { useAuth } from "@/contexts";
import { api } from "@/lib/api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Doctor = { id: number; first_name: string; last_name: string; full_name: string };
type Appointment = {
	id: number;
	scheduled_datetime: string;
	duration_minutes: number;
	status: string;
	appointment_type: string;
	notes?: string;
	doctor: Doctor;
};
type TimeSlot = { time: string; available: boolean; appointment_id?: number };

export default function AppointmentsV2() {
	const { user, isAuthenticated } = useAuth();
	const router = useRouter();
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState("");
	const [appointments, setAppointments] = React.useState<Appointment[]>([]);
	const [doctors, setDoctors] = React.useState<Doctor[]>([]);
	const [timeSlots, setTimeSlots] = React.useState<TimeSlot[]>([]);
	const [showBooking, setShowBooking] = React.useState(false);
	const [selectedDoctor, setSelectedDoctor] = React.useState("");
	const [selectedDate, setSelectedDate] = React.useState("");
	const [selectedType, setSelectedType] = React.useState("");

	const appointmentTypes = ["Consultation","Follow-up","Emergency","Telemedicine","Procedure"];

	React.useEffect(() => {
		if (!isAuthenticated) return;
		loadData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isAuthenticated]);

	async function loadData() {
		try {
			setLoading(true);
			if (!user) return;
			let appointmentsResponse;
			const isPatient = user.role === "patient";
			if (isPatient) {
				appointmentsResponse = await api.get("/api/appointments/patient-appointments");
				const doctorsResponse = await api.get("/api/users/doctors");
				setDoctors((doctorsResponse as any).data || []);
			} else {
				appointmentsResponse = await api.get(`/api/appointments?patient_id=${user.id}`);
				setDoctors([]);
			}
			setAppointments((appointmentsResponse as any).data || []);
			setError("");
		} catch (e: any) {
			setError("Failed to load appointments. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	async function loadTimeSlots(date: string, doctorId: string) {
		try {
			const response = await api.get(`/api/appointments/available-slots?date=${date}&doctor_id=${doctorId}`);
			setTimeSlots((response as any).data || []);
		} catch (e) {
			setError("Failed to load available time slots.");
		}
	}

	async function book(time: string) {
		if (!selectedDate || !selectedDoctor || !selectedType) {
			setError("Please fill in all required fields");
			return;
		}
		try {
			await api.post("/api/appointments", {
				patient_id: user?.id,
				doctor_id: parseInt(selectedDoctor),
				scheduled_datetime: `${selectedDate}T${time}:00`,
				duration_minutes: 30,
				appointment_type: selectedType,
				status: "scheduled",
			});
			setShowBooking(false);
			setSelectedDate("");
			setSelectedDoctor("");
			setSelectedType("");
			setTimeSlots([]);
			loadData();
		} catch (e: any) {
			setError(e?.response?.data?.detail || "Failed to book appointment. Please try again.");
		}
	}

	function getStatusBadge(status: string) {
		const map: any = {
			scheduled: { variant: "secondary", label: "Scheduled" },
			checked_in: { variant: "default", label: "Checked In" },
			in_consultation: { variant: "default", label: "In Consultation" },
			completed: { variant: "default", label: "Completed" },
			cancelled: { variant: "destructive", label: "Cancelled" },
		};
		const cfg = map[status] || { variant: "secondary", label: status };
		return <Badge variant={cfg.variant as any}>{cfg.label}</Badge>;
	}

	const upcoming = React.useMemo(() => {
		const now = new Date();
		return appointments
			.filter((a) => new Date(a.scheduled_datetime) >= now)
			.sort((a, b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime());
	}, [appointments]);

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Appointments (New)</CardTitle>
						<CardDescription>Check-in with QR, reschedule, and reminders</CardDescription>
					</div>
					<div className="flex gap-2">
						<Button variant="outline" onClick={loadData}><RefreshCcw className="mr-2 h-4 w-4" /> Refresh</Button>
						<Button onClick={() => setShowBooking(true)}><Plus className="mr-2 h-4 w-4" /> Book</Button>
					</div>
				</CardHeader>
				<CardContent>
					{error && (
						<Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
					)}
					{loading ? (
						<div className="flex items-center justify-center h-32">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : (
						<div className="space-y-3">
							{upcoming.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">No upcoming appointments</div>
							) : upcoming.map((a) => (
								<div key={a.id} className="flex items-center justify-between p-4 border rounded-lg">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<Stethoscope className="h-4 w-4 text-blue-600" />
											<span className="font-medium">Dr. {a.doctor.full_name}</span>
											{getStatusBadge(a.status)}
										</div>
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Clock className="h-4 w-4" />
											<span>{new Date(a.scheduled_datetime).toLocaleString()}</span>
										</div>
									</div>
									<div className="flex gap-2">
										{a.status === "scheduled" && (
											<Button variant="outline" size="sm" onClick={() => router.push(`/portal/consultation/${a.id}`)}>
												<Calendar className="h-4 w-4 mr-2" /> Join
											</Button>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Booking Sheet */}
			{showBooking && (
				<Card className="fixed inset-0 z-50 m-4 max-h-[90vh] overflow-y-auto">
					<CardHeader>
						<CardTitle>Book Appointment</CardTitle>
						<CardDescription>Select a doctor, date, and time</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<label className="text-sm font-medium mb-2 block">Doctor</label>
								<Select value={selectedDoctor} onValueChange={(v) => { setSelectedDoctor(v); if (selectedDate) loadTimeSlots(selectedDate, v); }}>
									<SelectTrigger>
										<SelectValue placeholder="Select a doctor" />
									</SelectTrigger>
									<SelectContent>
										{doctors.map((d) => (
											<SelectItem key={d.id} value={d.id.toString()}>Dr. {d.full_name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div>
								<label className="text-sm font-medium mb-2 block">Date</label>
								<input
									type="date"
									value={selectedDate}
									onChange={(e) => { setSelectedDate(e.target.value); if (selectedDoctor) loadTimeSlots(e.target.value, selectedDoctor); }}
									min={new Date().toISOString().split("T")[0]}
									aria-label="Select appointment date"
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								/>
							</div>
							<div>
								<label className="text-sm font-medium mb-2 block">Type</label>
								<Select value={selectedType} onValueChange={setSelectedType}>
									<SelectTrigger>
										<SelectValue placeholder="Select type" />
									</SelectTrigger>
									<SelectContent>
										{appointmentTypes.map((t) => (
											<SelectItem key={t} value={t}>{t}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						{timeSlots.length > 0 && (
							<div>
								<label className="text-sm font-medium mb-2 block">Available Times</label>
								<div className="grid grid-cols-4 md:grid-cols-6 gap-2">
									{timeSlots.map((s, i) => (
										<Button key={i} variant={s.available ? "outline" : "secondary"} disabled={!s.available} onClick={() => s.available && book(s.time)} className="h-10">
											{s.time}
										</Button>
									))}
								</div>
							</div>
						)}

						<div className="flex justify-end gap-2 pt-4">
							<Button variant="outline" onClick={() => setShowBooking(false)}>Close</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}


