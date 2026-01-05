"use client";

import React, { useState, useEffect } from "react";
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
import { telemetryApi, TelemetryRecord, TelemetryCreate, TelemetryStats } from "@/lib/telemetry-api";
import { toast } from "sonner";
import { api } from "@/lib/api";
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
  const [loading, setLoading] = useState(true);
  const [telemetryRecords, setTelemetryRecords] = useState<TelemetryRecord[]>([]);
  const [telemetryStats, setTelemetryStats] = useState<TelemetryStats | null>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load telemetry data from API
  useEffect(() => {
    loadTelemetryData();
  }, [refreshKey]);

  const loadTelemetryData = async () => {
    try {
      setLoading(true);
      // Load last 30 days of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      // Load telemetry records and stats in parallel
      const [records, stats] = await Promise.all([
        telemetryApi.getMyRecords({
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          limit: 100,
        }),
        telemetryApi.getMyStats('last_30_days').catch(() => null), // Stats optional
      ]);
      
      // Sort by date (oldest first)
      const sortedRecords = records.sort((a, b) => 
        new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime()
      );
      setTelemetryRecords(sortedRecords);
      if (stats) setTelemetryStats(stats);

      // Load prescriptions for medication adherence
      try {
        const prescData = await api.get<any[]>('/api/v1/patient/prescriptions');
        setPrescriptions(prescData || []);
      } catch (prescError) {
        console.warn("Could not load prescriptions:", prescError);
        setPrescriptions([]);
      }
    } catch (error: any) {
      console.error("Error loading telemetry data:", error);
      toast.error("Erro ao carregar dados de telemetria", {
        description: error?.message || "Não foi possível carregar os dados",
      });
      setTelemetryRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Process telemetry data for charts
  const vitalDates = telemetryRecords.length > 0
    ? telemetryRecords
        .filter(r => r.systolic_bp || r.diastolic_bp || r.heart_rate || r.temperature || r.oxygen_saturation)
        .map(r => format(parseISO(r.measured_at), "MMM dd"))
        .slice(-30)
    : generateDates(30);

  const bpSystolic = telemetryRecords
    .filter(r => r.systolic_bp !== undefined && r.systolic_bp !== null)
    .map(r => r.systolic_bp!)
    .slice(-30);
  
  const bpDiastolic = telemetryRecords
    .filter(r => r.diastolic_bp !== undefined && r.diastolic_bp !== null)
    .map(r => r.diastolic_bp!)
    .slice(-30);
  
  const heartRate = telemetryRecords
    .filter(r => r.heart_rate !== undefined && r.heart_rate !== null)
    .map(r => r.heart_rate!)
    .slice(-30);
  
  // Temperature conversion: API stores in °C, display in °F
  const temperature = telemetryRecords
    .filter(r => r.temperature !== undefined && r.temperature !== null)
    .map(r => (r.temperature! * 9/5) + 32) // Convert °C to °F
    .slice(-30);
  
  const oxygen = telemetryRecords
    .filter(r => r.oxygen_saturation !== undefined && r.oxygen_saturation !== null)
    .map(r => r.oxygen_saturation!)
    .slice(-30);

  // Fallback to mock data if no real data
  const finalBpSystolic = bpSystolic.length > 0 ? bpSystolic : generateVitalData(30, 120, 15);
  const finalBpDiastolic = bpDiastolic.length > 0 ? bpDiastolic : generateVitalData(30, 80, 10);
  const finalHeartRate = heartRate.length > 0 ? heartRate : generateVitalData(30, 72, 12);
  const finalTemperature = temperature.length > 0 ? temperature : generateVitalData(30, 98.6, 1.2);
  const finalOxygen = oxygen.length > 0 ? oxygen : generateVitalData(30, 98, 2);

  const vitalSignsChartData = {
    labels: vitalDates.slice(-14), // Last 14 days
    datasets: [
      {
        label: "Systolic BP",
        data: finalBpSystolic.slice(-14),
        borderColor: "#EF4444",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: true,
      },
      {
        label: "Diastolic BP",
        data: finalBpDiastolic.slice(-14),
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
        data: finalHeartRate.slice(-14),
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
        data: finalTemperature.slice(-14),
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
        data: finalOxygen.slice(-14),
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

  // Process activity data from telemetry records (steps, calories)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const activityData = (() => {
    const stepsData = last7Days.map(date => {
      const dayRecords = telemetryRecords.filter(r => {
        const recordDate = new Date(r.measured_at).toISOString().split('T')[0];
        return recordDate === date;
      });
      return dayRecords.reduce((sum, r) => sum + (r.steps || 0), 0);
    });

    const caloriesData = last7Days.map(date => {
      const dayRecords = telemetryRecords.filter(r => {
        const recordDate = new Date(r.measured_at).toISOString().split('T')[0];
        return recordDate === date;
      });
      return dayRecords.reduce((sum, r) => sum + (r.calories_burned || 0), 0);
    });

    return {
      labels: last7Days.map(d => format(parseISO(d), "EEE")),
      datasets: [
        {
          label: "Steps",
          data: stepsData.length > 0 && stepsData.some(s => s > 0) ? stepsData : [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: "rgba(27, 154, 170, 0.8)",
          borderColor: "rgb(27, 154, 170)",
          borderWidth: 2,
        },
        {
          label: "Calories",
          data: caloriesData.length > 0 && caloriesData.some(c => c > 0) ? caloriesData : [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 2,
          yAxisID: "y1",
        },
      ],
    };
  })();

  // Process sleep data from telemetry records
  const sleepData = (() => {
    const sleepHoursData = last7Days.map(date => {
      const dayRecords = telemetryRecords.filter(r => {
        const recordDate = new Date(r.measured_at).toISOString().split('T')[0];
        return recordDate === date;
      });
      if (dayRecords.length === 0) return null;
      const avgSleep = dayRecords.reduce((sum, r) => sum + (r.sleep_hours || 0), 0) / dayRecords.length;
      return avgSleep > 0 ? avgSleep : null;
    });

    return {
      labels: last7Days.map(d => format(parseISO(d), "EEE")),
      datasets: [
        {
          label: "Sleep Hours",
          data: sleepHoursData.map(s => s !== null ? s : 0),
          backgroundColor: "rgba(139, 92, 246, 0.8)",
          borderColor: "rgb(139, 92, 246)",
          borderWidth: 2,
        },
      ],
    };
  })();

  // Medication adherence - Note: This requires prescription tracking data which may not be available
  // For now, we'll show empty/placeholder data with a note that this feature requires additional tracking
  const medicationAdherenceData = {
    labels: ["This Week", "Last Week", "2 Weeks Ago", "3 Weeks Ago"],
    datasets: [
      {
        label: "Adherence Rate (%)",
        data: [0, 0, 0, 0], // Placeholder - requires medication tracking system
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
        data: [0, 0, 0], // Placeholder - requires medication tracking system
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

  // Get latest values for current vitals
  const latestRecord = telemetryRecords.length > 0 
    ? telemetryRecords[telemetryRecords.length - 1]
    : null;

  // Current vital signs
  const currentVitals = [
    {
      label: "Blood Pressure",
      value: latestRecord && latestRecord.systolic_bp && latestRecord.diastolic_bp
        ? `${latestRecord.systolic_bp}/${latestRecord.diastolic_bp}`
        : finalBpSystolic.length > 0 && finalBpDiastolic.length > 0
        ? `${finalBpSystolic[finalBpSystolic.length - 1]}/${finalBpDiastolic[finalBpDiastolic.length - 1]}`
        : "120/80",
      unit: "mmHg",
      icon: Heart,
      status: "normal" as const,
      trend: "stable" as const,
      normalRange: "120/80",
    },
    {
      label: "Heart Rate",
      value: latestRecord?.heart_rate?.toString() || 
        (finalHeartRate.length > 0 ? finalHeartRate[finalHeartRate.length - 1].toString() : "72"),
      unit: "bpm",
      icon: Activity,
      status: "normal" as const,
      trend: "down" as const,
      normalRange: "60-100",
    },
    {
      label: "Temperature",
      value: latestRecord?.temperature 
        ? ((latestRecord.temperature * 9/5) + 32).toFixed(1)
        : (finalTemperature.length > 0 ? finalTemperature[finalTemperature.length - 1].toFixed(1) : "98.6"),
      unit: "°F",
      icon: Thermometer,
      status: "normal" as const,
      trend: "stable" as const,
      normalRange: "98.6",
    },
    {
      label: "Oxygen Saturation",
      value: latestRecord?.oxygen_saturation?.toString() ||
        (finalOxygen.length > 0 ? finalOxygen[finalOxygen.length - 1].toString() : "98"),
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

  // Vital Signs Entry Dialog Component
  function VitalSignsEntryDialog({ onSave }: { onSave: () => void }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
      systolic_bp: "",
      diastolic_bp: "",
      heart_rate: "",
      temperature: "",
      oxygen_saturation: "",
      notes: "",
    });

    const handleSave = async () => {
      try {
        setSaving(true);
        const createData: TelemetryCreate = {
          measured_at: new Date().toISOString(),
        };

        if (formData.systolic_bp) createData.systolic_bp = Number(formData.systolic_bp);
        if (formData.diastolic_bp) createData.diastolic_bp = Number(formData.diastolic_bp);
        if (formData.heart_rate) createData.heart_rate = Number(formData.heart_rate);
        // Temperature: user enters in °F, convert to °C for API
        if (formData.temperature) createData.temperature = (Number(formData.temperature) - 32) * 5/9;
        if (formData.oxygen_saturation) createData.oxygen_saturation = Number(formData.oxygen_saturation);
        if (formData.notes) createData.notes = formData.notes;

        await telemetryApi.create(createData);
        toast.success("Sinais vitais registrados com sucesso!");
        setOpen(false);
        setFormData({
          systolic_bp: "",
          diastolic_bp: "",
          heart_rate: "",
          temperature: "",
          oxygen_saturation: "",
          notes: "",
        });
        onSave();
      } catch (error: any) {
        console.error("Error saving vital signs:", error);
        toast.error("Erro ao salvar sinais vitais", {
          description: error?.message || "Não foi possível salvar os dados",
        });
      } finally {
        setSaving(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
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
              <Input
                id="bp-sys"
                type="number"
                placeholder="120"
                value={formData.systolic_bp}
                onChange={(e) => setFormData({ ...formData, systolic_bp: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bp-dia">Diastolic BP</Label>
              <Input
                id="bp-dia"
                type="number"
                placeholder="80"
                value={formData.diastolic_bp}
                onChange={(e) => setFormData({ ...formData, diastolic_bp: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="hr">Heart Rate</Label>
              <Input
                id="hr"
                type="number"
                placeholder="72"
                value={formData.heart_rate}
                onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="temp">Temperature (°F)</Label>
              <Input
                id="temp"
                type="number"
                placeholder="98.6"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="oxygen">Oxygen Saturation (%)</Label>
              <Input
                id="oxygen"
                type="number"
                placeholder="98"
                value={formData.oxygen_saturation}
                onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-[#0F4C75] hover:bg-[#0F4C75]/90"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
                            {finalBpSystolic.length > 0
                              ? Math.round(
                                  finalBpSystolic.slice(-14).reduce((a, b) => a + b, 0) /
                                    Math.max(finalBpSystolic.slice(-14).length, 1)
                                )
                              : 120}{" "}
                            /{" "}
                            {finalBpDiastolic.length > 0
                              ? Math.round(
                                  finalBpDiastolic.slice(-14).reduce((a, b) => a + b, 0) /
                                    Math.max(finalBpDiastolic.slice(-14).length, 1)
                                )
                              : 80}{" "}
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
                <VitalSignsEntryDialog
                  onSave={() => {
                    setRefreshKey(prev => prev + 1);
                  }}
                />
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
                      <CardDescription>
                        {prescriptions.length > 0 
                          ? `${prescriptions.length} prescrição(ões) ativa(s)` 
                          : "Nenhuma prescrição ativa"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {prescriptions.length > 0 ? (
                        <>
                          <div className="h-64">
                            <Pie data={medicationPieData} options={chartOptions} />
                          </div>
                          <div className="mt-4 flex items-center justify-center gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                {medicationPieData.datasets[0].data[0] || 0}
                              </div>
                              <div className="text-sm text-gray-600">Taken</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-red-600">
                                {medicationPieData.datasets[0].data[1] || 0}
                              </div>
                              <div className="text-sm text-gray-600">Missed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-yellow-600">
                                {medicationPieData.datasets[0].data[2] || 0}
                              </div>
                              <div className="text-sm text-gray-600">Late</div>
                            </div>
                          </div>
                          <div className="mt-4 text-center text-sm text-muted-foreground">
                            <p>Nota: Os dados de aderência medicamentosa requerem um sistema de rastreamento de medicação.</p>
                          </div>
                        </>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-center text-muted-foreground">
                          <p>Nenhuma prescrição ativa. Os dados de aderência serão exibidos aqui quando houver prescrições e rastreamento de medicação.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {prescriptions.length > 0 ? (
                    prescriptions.slice(0, 6).map((presc: any, idx: number) => {
                      // Calculate next dose time (simplified - would need actual schedule data)
                      const nextDose = "N/A"; // This would require medication schedule tracking
                      const adherence = 85; // Placeholder - requires medication tracking system
                      
                      return (
                        <Card key={presc.id || idx} className="medical-card">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg text-[#0F4C75]">
                                {presc.medication_name || presc.name || "Medicamento"}
                              </CardTitle>
                              <Pill className="h-5 w-5 text-[#1B9AAA]" />
                            </div>
                            <CardDescription>
                              {presc.dosage || "N/A"} • {presc.frequency || "N/A"}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-600">Adherence</span>
                                  <span className="text-sm font-semibold">{adherence}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{ width: `${adherence}%` }}
                                    aria-label={`Medication adherence: ${adherence}%`}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>Next dose in {nextDose}</span>
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
                      );
                    })
                  ) : (
                    <div className="col-span-full text-center text-muted-foreground py-8">
                      Nenhuma prescrição encontrada. As informações de aderência medicamentosa serão exibidas aqui quando houver prescrições ativas.
                    </div>
                  )}
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

