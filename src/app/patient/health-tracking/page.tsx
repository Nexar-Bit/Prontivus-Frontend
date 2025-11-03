"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Heart,
  Activity,
  Thermometer,
  Wind,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Calendar,
  Clock,
  Pill,
  ScanLine,
  Smartphone,
  Dumbbell,
  Apple,
  Moon,
  AlertCircle,
  CheckCircle2,
  Info,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import { PatientHeader, PatientSidebar, PatientMobileNav } from "@/components/patient/Navigation";
import { BodyChart } from "@/components/patient/BodyChart";
import { format, subDays, parseISO } from "date-fns";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Mock data generators
const generateDates = (days: number) => {
  return Array.from({ length: days }, (_, i) =>
    format(subDays(new Date(), days - i - 1), "MMM dd")
  );
};

const generateVitalData = (days: number, base: number, variance: number) => {
  return Array.from({ length: days }, () =>
    Math.round(base + (Math.random() - 0.5) * variance)
  );
};

export default function HealthTrackingPage() {
  const [activeTab, setActiveTab] = useState("vitals");

  // Mock vital signs data
  const vitalDates = generateDates(30);
  const bpSystolic = generateVitalData(30, 120, 15);
  const bpDiastolic = generateVitalData(30, 80, 10);
  const heartRate = generateVitalData(30, 72, 12);
  const temperature = generateVitalData(30, 98.6, 1.2);
  const oxygen = generateVitalData(30, 98, 2);

  const vitalSignsChartData = {
    labels: vitalDates.slice(-14), // Last 14 days
    datasets: [
      {
        label: "Systolic BP",
        data: bpSystolic.slice(-14),
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Diastolic BP",
        data: bpDiastolic.slice(-14),
        borderColor: "#F59E0B",
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const heartRateChartData = {
    labels: vitalDates.slice(-14),
    datasets: [
      {
        label: "Heart Rate (bpm)",
        data: heartRate.slice(-14),
        borderColor: "#1B9AAA",
        backgroundColor: "rgba(27, 154, 170, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const temperatureChartData = {
    labels: vitalDates.slice(-14),
    datasets: [
      {
        label: "Temperature (°F)",
        data: temperature.slice(-14),
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const oxygenChartData = {
    labels: vitalDates.slice(-14),
    datasets: [
      {
        label: "Oxygen Saturation (%)",
        data: oxygen.slice(-14),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Medication adherence data
  const medicationAdherenceData = {
    labels: ["This Week", "Last Week", "2 Weeks Ago", "3 Weeks Ago"],
    datasets: [
      {
        label: "Adherence Rate (%)",
        data: [92, 88, 95, 87],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(16, 185, 129, 0.8)",
        ],
        borderColor: [
          "rgb(16, 185, 129)",
          "rgb(16, 185, 129)",
          "rgb(16, 185, 129)",
          "rgb(16, 185, 129)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const medicationPieData = {
    labels: ["Taken", "Missed", "Late"],
    datasets: [
      {
        data: [28, 2, 1],
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(245, 158, 11, 0.8)",
        ],
        borderColor: [
          "rgb(16, 185, 129)",
          "rgb(239, 68, 68)",
          "rgb(245, 158, 11)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Activity data
  const activityData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Steps",
        data: [8234, 10234, 9432, 11234, 8734, 5432, 7234],
        backgroundColor: "rgba(27, 154, 170, 0.8)",
        borderColor: "rgb(27, 154, 170)",
        borderWidth: 2,
      },
      {
        label: "Calories",
        data: [340, 420, 380, 460, 360, 280, 320],
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "rgb(239, 68, 68)",
        borderWidth: 2,
        yAxisID: "y1",
      },
    ],
  };

  const sleepData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Sleep Hours",
        data: [7.5, 8, 7, 7.5, 6.5, 9, 8.5],
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        borderColor: "rgb(139, 92, 246)",
        borderWidth: 2,
      },
    ],
  };

  // Current vital signs
  const currentVitals = [
    {
      label: "Blood Pressure",
      value: `${bpSystolic[bpSystolic.length - 1]}/${bpDiastolic[bpDiastolic.length - 1]}`,
      unit: "mmHg",
      icon: Heart,
      status: "normal" as const,
      trend: "stable" as const,
      normalRange: "120/80",
    },
    {
      label: "Heart Rate",
      value: heartRate[heartRate.length - 1].toString(),
      unit: "bpm",
      icon: Activity,
      status: "normal" as const,
      trend: "down" as const,
      normalRange: "60-100",
    },
    {
      label: "Temperature",
      value: temperature[temperature.length - 1].toFixed(1),
      unit: "°F",
      icon: Thermometer,
      status: "normal" as const,
      trend: "stable" as const,
      normalRange: "98.6",
    },
    {
      label: "Oxygen Saturation",
      value: oxygen[oxygen.length - 1].toString(),
      unit: "%",
      icon: Wind,
      status: "normal" as const,
      trend: "up" as const,
      normalRange: "95-100",
    },
  ];

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: "normal" | "warning" | "critical") => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-700 border-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <PatientHeader showSearch notificationCount={3} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#0F4C75]">Health Tracking</h1>
                <p className="text-gray-600 mt-1">
                  Monitor your health metrics and track your wellness journey
                </p>
              </div>
              <Button className="bg-[#0F4C75] hover:bg-[#0F4C75]/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            {/* Quick Vital Signs Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentVitals.map((vital, index) => {
                const Icon = vital.icon;
                return (
                  <Card key={index} className="medical-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-12 w-12 rounded-full bg-[#0F4C75]/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-[#1B9AAA]" />
                        </div>
                        {getTrendIcon(vital.trend)}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">{vital.label}</p>
                        <p className="text-2xl font-bold text-[#0F4C75]">
                          {vital.value}
                          <span className="text-lg text-gray-500 ml-1">{vital.unit}</span>
                        </p>
                        <p className="text-xs text-gray-500">Normal: {vital.normalRange}</p>
                      </div>
                      <div className="mt-4">
                        <Badge className={getStatusColor(vital.status)}>
                          {vital.status === "normal" ? "Normal" : vital.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="vitals">Vital Signs</TabsTrigger>
                <TabsTrigger value="symptoms">Symptoms</TabsTrigger>
                <TabsTrigger value="medications">Medications</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              {/* Vital Signs Tab */}
              <TabsContent value="vitals" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Blood Pressure Chart */}
                  <Card className="medical-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-[#0F4C75]">Blood Pressure Trend</CardTitle>
                          <CardDescription>Last 14 days</CardDescription>
                        </div>
                        <Heart className="h-5 w-5 text-[#1B9AAA]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Line data={vitalSignsChartData} options={chartOptions} />
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-800">
                            Normal range: 120/80 mmHg. Your average:{" "}
                            {Math.round(
                              bpSystolic.slice(-14).reduce((a, b) => a + b, 0) / 14
                            )}{" "}
                            /{" "}
                            {Math.round(
                              bpDiastolic.slice(-14).reduce((a, b) => a + b, 0) / 14
                            )}{" "}
                            mmHg
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Heart Rate Chart */}
                  <Card className="medical-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-[#0F4C75]">Heart Rate Trend</CardTitle>
                          <CardDescription>Last 14 days</CardDescription>
                        </div>
                        <Activity className="h-5 w-5 text-[#1B9AAA]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Line data={heartRateChartData} options={chartOptions} />
                      </div>
                      <div className="mt-4 p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-green-800">
                            Within normal range (60-100 bpm)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Temperature Chart */}
                  <Card className="medical-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-[#0F4C75]">Temperature Trend</CardTitle>
                          <CardDescription>Last 14 days</CardDescription>
                        </div>
                        <Thermometer className="h-5 w-5 text-[#1B9AAA]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Line data={temperatureChartData} options={chartOptions} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Oxygen Saturation Chart */}
                  <Card className="medical-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-[#0F4C75]">Oxygen Saturation</CardTitle>
                          <CardDescription>Last 14 days</CardDescription>
                        </div>
                        <Wind className="h-5 w-5 text-[#1B9AAA]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Line data={oxygenChartData} options={chartOptions} />
                      </div>
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-800">
                            Excellent oxygen levels (95-100%)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Entry Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-[#0F4C75] hover:bg-[#0F4C75]/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Quick Vital Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Record Vital Signs</DialogTitle>
                      <DialogDescription>
                        Quickly log your vital signs with smart defaults
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div>
                        <Label htmlFor="bp-sys">Systolic BP</Label>
                        <Input id="bp-sys" type="number" placeholder="120" defaultValue="120" />
                      </div>
                      <div>
                        <Label htmlFor="bp-dia">Diastolic BP</Label>
                        <Input id="bp-dia" type="number" placeholder="80" defaultValue="80" />
                      </div>
                      <div>
                        <Label htmlFor="hr">Heart Rate</Label>
                        <Input id="hr" type="number" placeholder="72" defaultValue="72" />
                      </div>
                      <div>
                        <Label htmlFor="temp">Temperature</Label>
                        <Input id="temp" type="number" placeholder="98.6" defaultValue="98.6" />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="oxygen">Oxygen Saturation</Label>
                        <Input id="oxygen" type="number" placeholder="98" defaultValue="98" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button className="bg-[#0F4C75] hover:bg-[#0F4C75]/90">Save</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* Symptoms Tab */}
              <TabsContent value="symptoms" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <BodyChart interactive={true} />
                  </div>
                  <div className="space-y-4">
                    <Card className="medical-card">
                      <CardHeader>
                        <CardTitle className="text-[#0F4C75]">Recent Symptoms</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {[
                          {
                            symptom: "Headache",
                            severity: "mild" as const,
                            date: "2 days ago",
                            location: "Head",
                          },
                          {
                            symptom: "Chest pain",
                            severity: "moderate" as const,
                            date: "5 days ago",
                            location: "Chest",
                          },
                          {
                            symptom: "Fatigue",
                            severity: "mild" as const,
                            date: "1 week ago",
                            location: "General",
                          },
                        ].map((symptom, idx) => (
                          <div
                            key={idx}
                            className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{symptom.symptom}</span>
                              <Badge
                                className={
                                  symptom.severity === "mild"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
                                {symptom.severity}
                              </Badge>
                            </div>
                            <div className="text-sm text-gray-500">
                              {symptom.location} • {symptom.date}
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-[#0F4C75] hover:bg-[#0F4C75]/90">
                          <Plus className="h-4 w-4 mr-2" />
                          Log Symptom
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Log New Symptom</DialogTitle>
                          <DialogDescription>
                            Record a symptom with location and severity
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <Label htmlFor="symptom-name">Symptom</Label>
                            <Input id="symptom-name" placeholder="e.g., Headache" />
                          </div>
                          <div>
                            <Label htmlFor="symptom-severity">Severity</Label>
                            <select
                              id="symptom-severity"
                              aria-label="Symptom severity level"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="mild">Mild</option>
                              <option value="moderate">Moderate</option>
                              <option value="severe">Severe</option>
                            </select>
                          </div>
                          <div>
                            <Label htmlFor="symptom-notes">Notes (optional)</Label>
                            <Input id="symptom-notes" placeholder="Additional details..." />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Cancel</Button>
                          <Button className="bg-[#0F4C75] hover:bg-[#0F4C75]/90">Save</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </TabsContent>

              {/* Medications Tab */}
              <TabsContent value="medications" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="medical-card">
                    <CardHeader>
                      <CardTitle className="text-[#0F4C75]">Adherence Trend</CardTitle>
                      <CardDescription>Weekly medication compliance</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Bar data={medicationAdherenceData} options={chartOptions} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="medical-card">
                    <CardHeader>
                      <CardTitle className="text-[#0F4C75]">This Week's Adherence</CardTitle>
                      <CardDescription>31 doses scheduled</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Pie data={medicationPieData} options={chartOptions} />
                      </div>
                      <div className="mt-4 flex items-center justify-center gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">28</div>
                          <div className="text-sm text-gray-600">Taken</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">2</div>
                          <div className="text-sm text-gray-600">Missed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">1</div>
                          <div className="text-sm text-gray-600">Late</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      name: "Metformin",
                      dosage: "500mg",
                      frequency: "Twice daily",
                      adherence: 95,
                      nextDose: "2 hours",
                    },
                    {
                      name: "Aspirin",
                      dosage: "81mg",
                      frequency: "Once daily",
                      adherence: 100,
                      nextDose: "8 hours",
                    },
                    {
                      name: "Lisinopril",
                      dosage: "10mg",
                      frequency: "Once daily",
                      adherence: 87,
                      nextDose: "12 hours",
                    },
                  ].map((med, idx) => (
                    <Card key={idx} className="medical-card">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-[#0F4C75]">{med.name}</CardTitle>
                          <Pill className="h-5 w-5 text-[#1B9AAA]" />
                        </div>
                        <CardDescription>{med.dosage} • {med.frequency}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-600">Adherence</span>
                              <span className="text-sm font-semibold">{med.adherence}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 transition-all"
                                style={{ width: `${med.adherence}%` }}
                                aria-label={`Medication adherence: ${med.adherence}%`}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>Next dose in {med.nextDose}</span>
                          </div>
                          <Button
                            variant="outline"
                            className="w-full border-[#1B9AAA] text-[#1B9AAA]"
                          >
                            <ScanLine className="h-4 w-4 mr-2" />
                            Log Dose
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="medical-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-[#0F4C75]">Activity Tracking</CardTitle>
                          <CardDescription>Steps and calories burned</CardDescription>
                        </div>
                        <Dumbbell className="h-5 w-5 text-[#1B9AAA]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Bar
                          data={activityData}
                          options={{
                            ...chartOptions,
                            scales: {
                              ...chartOptions.scales,
                              y: {
                                type: "linear" as const,
                                display: true,
                                position: "left" as const,
                              },
                              y1: {
                                type: "linear" as const,
                                display: true,
                                position: "right" as const,
                                grid: {
                                  drawOnChartArea: false,
                                },
                              },
                            },
                          }}
                        />
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-[#0F4C75]">8,234</div>
                          <div className="text-xs text-gray-600">Avg Steps/Day</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">340</div>
                          <div className="text-xs text-gray-600">Avg Calories/Day</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">6.2</div>
                          <div className="text-xs text-gray-600">Hours Active/Week</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="medical-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-[#0F4C75]">Sleep Tracking</CardTitle>
                          <CardDescription>Daily sleep hours</CardDescription>
                        </div>
                        <Moon className="h-5 w-5 text-[#1B9AAA]" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <Bar data={sleepData} options={chartOptions} />
                      </div>
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Average Sleep</div>
                            <div className="text-2xl font-bold text-[#0F4C75]">7.6 hours</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Target</div>
                            <div className="text-xl font-semibold text-purple-600">8 hours</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="medical-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Dumbbell className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[#0F4C75]">45 min</div>
                          <div className="text-sm text-gray-600">Exercise Today</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="medical-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Apple className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-[#0F4C75]">1,850</div>
                          <div className="text-sm text-gray-600">Calories Today</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="medical-card">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <Smartphone className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">Connected</div>
                          <div className="text-sm text-gray-600">Wearable Device</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="medical-card border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-[#0F4C75]">Health Trends</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <div className="font-semibold text-green-800">
                              Blood Pressure Improving
                            </div>
                            <div className="text-sm text-green-700 mt-1">
                              Your BP has decreased by 8% over the past month, moving closer to
                              optimal range.
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="font-semibold text-blue-800">
                              Activity Level Stable
                            </div>
                            <div className="text-sm text-blue-700 mt-1">
                              Maintaining consistent exercise routine. Consider increasing intensity
                              gradually.
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="medical-card border-l-4 border-l-purple-500">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-[#0F4C75]">Recommendations</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        {
                          title: "Maintain medication schedule",
                          description: "Your adherence is excellent. Keep it up!",
                          icon: Pill,
                        },
                        {
                          title: "Increase daily steps",
                          description: "Aim for 10,000 steps to improve cardiovascular health",
                          icon: Activity,
                        },
                        {
                          title: "Improve sleep quality",
                          description: "Consistent 8-hour sleep pattern recommended",
                          icon: Moon,
                        },
                      ].map((rec, idx) => {
                        const Icon = rec.icon;
                        return (
                          <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                              <Icon className="h-5 w-5 text-purple-600 mt-0.5" />
                              <div>
                                <div className="font-medium text-gray-900">{rec.title}</div>
                                <div className="text-sm text-gray-600 mt-1">{rec.description}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>

                <Card className="medical-card border-l-4 border-l-red-500">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-[#0F4C75]">Provider Alerts</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <div className="font-semibold text-yellow-800">
                            Blood Pressure Fluctuation
                          </div>
                          <div className="text-sm text-yellow-700 mt-1">
                            Your provider has been notified of recent BP readings outside normal
                            range. Schedule a follow-up if this continues.
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="medical-card">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-[#1B9AAA]" />
                      <CardTitle className="text-[#0F4C75]">Comparative Analysis</CardTitle>
                    </div>
                    <CardDescription>
                      Your metrics compared to population norms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { metric: "Blood Pressure", you: "125/82", average: "120/80", status: "slightly_high" },
                        { metric: "Heart Rate", you: "72 bpm", average: "75 bpm", status: "normal" },
                        { metric: "Steps per Day", you: "8,234", average: "7,500", status: "above_average" },
                        { metric: "Sleep Duration", you: "7.6 hrs", average: "7.2 hrs", status: "above_average" },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.metric}</div>
                            <div className="text-sm text-gray-600">
                              You: {item.you} • Average: {item.average}
                            </div>
                          </div>
                          <Badge
                            className={
                              item.status === "normal" || item.status === "above_average"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {item.status === "normal"
                              ? "Normal"
                              : item.status === "above_average"
                              ? "Above Avg"
                              : "Slightly High"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}

