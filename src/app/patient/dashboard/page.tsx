"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  Heart,
  Activity,
  TrendingUp,
  FileText,
  Video,
  Clock,
  MapPin,
  Calendar,
  TestTube,
  MessageCircle,
  Pill,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PatientSidebar, PatientMobileNav, PatientHeader } from "@/components/patient/Navigation";
import { api } from "@/lib/api";

interface NavigationItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

interface UpcomingAppointment {
  id: number;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  type: "in-person" | "virtual";
  location?: string;
}

interface HealthMetric {
  label: string;
  value: string;
  trend?: "up" | "down" | "stable";
  status: "normal" | "warning" | "critical";
}

interface RecentActivity {
  id: number;
  type: "test_result" | "prescription" | "message" | "appointment";
  title: string;
  description: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function PatientDashboard() {
  const [upcomingAppointment, setUpcomingAppointment] = React.useState<UpcomingAppointment | null>(null);
  const [recentActivity, setRecentActivity] = React.useState<RecentActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const healthMetrics: HealthMetric[] = [];

  React.useEffect(() => {
    const load = async () => {
      try {
        // Fetch current patient's appointments
        const appts = await api.get<any[]>(`/api/appointments/patient-appointments`);
        const now = new Date();
        const future = appts
          .filter(a => new Date(a.scheduled_datetime) >= now)
          .sort((a,b) => new Date(a.scheduled_datetime).getTime() - new Date(b.scheduled_datetime).getTime());
        const next = future[0];
        if (next) {
          setUpcomingAppointment({
            id: next.id,
            date: next.scheduled_datetime,
            time: format(new Date(next.scheduled_datetime), "HH:mm"),
            doctor: next.doctor_name,
            specialty: next.appointment_type || "",
            type: "virtual",
            location: "",
          });
        } else {
          setUpcomingAppointment(null);
        }

        // Recent activity from last 10 appointments
        const recent = appts
          .sort((a,b) => new Date(b.scheduled_datetime).getTime() - new Date(a.scheduled_datetime).getTime())
          .slice(0, 10)
          .map((a, idx) => ({
            id: a.id,
            type: "appointment" as const,
            title: a.status === "completed" ? "Consulta Concluída" : "Consulta",
            description: a.doctor_name,
            date: format(new Date(a.scheduled_datetime), "dd/MM/yyyy HH:mm"),
            icon: Calendar,
          }));
        setRecentActivity(recent);
      } catch {
        setUpcomingAppointment(null);
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <PatientHeader showSearch notificationCount={3} />

      {/* Mobile Navigation */}
      <PatientMobileNav />

      <div className="flex">
        {/* Left Sidebar Navigation - Desktop Only */}
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Dashboard Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Health Summary Card */}
              <Card className="medical-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-[#0F4C75]">Resumo de Saúde</CardTitle>
                      <CardDescription>Informações médicas recentes</CardDescription>
                    </div>
                    <Heart className="h-6 w-6 text-[#1B9AAA]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#0F4C75]/5 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-600">Última Medição</p>
                        <p className="text-lg font-semibold text-[#0F4C75]">15 de Janeiro, 2024</p>
                      </div>
                      <Activity className="h-8 w-8 text-[#1B9AAA]" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Condições Ativas</p>
                        <p className="text-xl font-bold text-[#0F4C75]">2</p>
                      </div>
                      <div className="p-3 bg-white border border-gray-200 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Medicações</p>
                        <p className="text-xl font-bold text-[#0F4C75]">3</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-[#1B9AAA] text-[#1B9AAA]">
                      Ver Detalhes
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Next Appointment Card */}
              <Card className="medical-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-[#0F4C75]">Próxima Consulta</CardTitle>
                      <CardDescription>Seu próximo atendimento</CardDescription>
                    </div>
                    <Calendar className="h-6 w-6 text-[#1B9AAA]" />
                  </div>
                </CardHeader>
                <CardContent>
                  {upcomingAppointment ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gradient-to-br from-[#0F4C75] to-[#1B9AAA] rounded-lg text-white">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm opacity-90">Data e Hora</p>
                            <p className="text-xl font-bold">
                              {format(new Date(upcomingAppointment.date), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                            <p className="text-lg">{upcomingAppointment.time}</p>
                          </div>
                          <Clock className="h-8 w-8 opacity-80" />
                        </div>
                        <div className="border-t border-white/20 pt-3 mt-3">
                          <p className="text-sm opacity-90 mb-1">Médico</p>
                          <p className="font-semibold">{upcomingAppointment.doctor}</p>
                          <p className="text-sm opacity-80">{upcomingAppointment.specialty}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {upcomingAppointment.type === "virtual" ? (
                          <>
                            <Video className="h-4 w-4" />
                            <span>Consulta Virtual</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4" />
                            <span>{upcomingAppointment.location}</span>
                          </>
                        )}
                      </div>
                      <Button className="w-full bg-[#0F4C75] hover:bg-[#0F4C75]/90">
                        {upcomingAppointment.type === "virtual" ? (
                          <>
                            <Video className="h-4 w-4 mr-2" />
                            Entrar na Consulta
                          </>
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-2" />
                            Ver Localização
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">Nenhuma consulta agendada</p>
                      <Button className="bg-[#0F4C75] hover:bg-[#0F4C75]/90">
                        Agendar Consulta
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card className="medical-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-[#0F4C75]">Atividades Recentes</CardTitle>
                      <CardDescription>Últimas atualizações do seu prontuário</CardDescription>
                    </div>
                    <FileText className="h-6 w-6 text-[#1B9AAA]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="h-10 w-10 rounded-full bg-[#0F4C75]/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-[#0F4C75]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                  <Button variant="outline" className="w-full mt-4 border-[#1B9AAA] text-[#1B9AAA]">
                    Ver Todas as Atividades
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="medical-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl text-[#0F4C75]">Ações Rápidas</CardTitle>
                      <CardDescription>Acesso rápido a funcionalidades</CardDescription>
                    </div>
                    <Activity className="h-6 w-6 text-[#1B9AAA]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center p-4 border-2 border-[#1B9AAA] hover:bg-[#1B9AAA]/5"
                    >
                      <Calendar className="h-6 w-6 mb-2 text-[#1B9AAA]" />
                      <span className="text-sm font-medium">Agendar</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center p-4 border-2 border-[#1B9AAA] hover:bg-[#1B9AAA]/5"
                    >
                      <MessageCircle className="h-6 w-6 mb-2 text-[#1B9AAA]" />
                      <span className="text-sm font-medium">Mensagens</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center p-4 border-2 border-[#1B9AAA] hover:bg-[#1B9AAA]/5"
                    >
                      <FileText className="h-6 w-6 mb-2 text-[#1B9AAA]" />
                      <span className="text-sm font-medium">Upload</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto flex-col items-center justify-center p-4 border-2 border-[#1B9AAA] hover:bg-[#1B9AAA]/5"
                    >
                      <TestTube className="h-6 w-6 mb-2 text-[#1B9AAA]" />
                      <span className="text-sm font-medium">Resultados</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-80 bg-white border-l border-gray-200 min-h-[calc(100vh-80px)] sticky top-[80px] hidden xl:block overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Upcoming Appointments */}
            <div>
              <h3 className="text-lg font-semibold text-[#0F4C75] mb-4">Próximas Consultas</h3>
              <div className="space-y-3">
                {upcomingAppointment && (
                  <Card className="border-[#1B9AAA]/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-full bg-[#1B9AAA]/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-6 w-6 text-[#1B9AAA]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900">
                            {format(new Date(upcomingAppointment.date), "dd MMM", { locale: ptBR })}
                          </p>
                          <p className="text-xs text-gray-600">{upcomingAppointment.time}</p>
                          <p className="text-xs text-[#0F4C75] mt-1">{upcomingAppointment.doctor}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Button variant="outline" className="w-full border-[#1B9AAA] text-[#1B9AAA]">
                  Ver Todas
                </Button>
              </div>
            </div>

            {/* Quick Health Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-[#0F4C75] mb-4">Métricas de Saúde</h3>
              <div className="space-y-3">
                {healthMetrics.map((metric, index) => (
                  <Card key={index} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">{metric.label}</p>
                          <p className="text-lg font-bold text-[#0F4C75]">{metric.value}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {metric.trend === "up" && (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          )}
                          {metric.trend === "down" && (
                            <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />
                          )}
                          {metric.trend === "stable" && (
                            <div className="h-4 w-4 rounded-full bg-gray-400"></div>
                          )}
                          {metric.status === "normal" && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              Normal
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

