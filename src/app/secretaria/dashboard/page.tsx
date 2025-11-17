"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CalendarDays, Users, Clock, CheckCircle2, AlertCircle, RefreshCw, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface DashboardStats {
  today_appointments_count: number;
  confirmed_appointments_count: number;
  total_patients_count: number;
  pending_tasks_count: number;
}

interface TodayAppointment {
  id: number;
  patient_name: string;
  doctor_name: string;
  scheduled_datetime: string;
  status: string;
  appointment_type?: string;
}

interface DashboardData {
  stats: DashboardStats;
  today_appointments: TodayAppointment[];
}

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: string;
  completed: boolean;
  completed_at?: string;
  due_date?: string;
  created_at: string;
  updated_at?: string;
}

export default function SecretaryDashboard() {
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Média");

  useEffect(() => {
    loadDashboardData();
    loadTasks();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.get<DashboardData>("/api/secretary/dashboard");
      setDashboardData(data);
    } catch (error: any) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Erro ao carregar dashboard", {
        description: error?.message || error?.detail || "Não foi possível carregar os dados do dashboard",
      });
      // Set default empty data on error
      setDashboardData({
        stats: {
          today_appointments_count: 0,
          confirmed_appointments_count: 0,
          total_patients_count: 0,
          pending_tasks_count: 0,
        },
        today_appointments: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    try {
      setTasksLoading(true);
      const data = await api.get<Task[]>("/api/secretary/tasks");
      setTasks(data);
    } catch (error: any) {
      console.error("Failed to load tasks:", error);
      toast.error("Erro ao carregar tarefas", {
        description: error?.message || error?.detail || "Não foi possível carregar as tarefas",
      });
    } finally {
      setTasksLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number, currentCompleted: boolean) => {
    try {
      await api.patch(`/api/secretary/tasks/${taskId}`, {
        completed: !currentCompleted,
      });
      await loadTasks();
      await loadDashboardData(); // Refresh stats
      toast.success("Tarefa atualizada com sucesso");
    } catch (error: any) {
      console.error("Failed to update task:", error);
      toast.error("Erro ao atualizar tarefa", {
        description: error?.message || error?.detail || "Não foi possível atualizar a tarefa",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      toast.error("Título da tarefa é obrigatório");
      return;
    }

    try {
      await api.post("/api/secretary/tasks", {
        title: newTaskTitle,
        description: newTaskDescription || undefined,
        priority: newTaskPriority,
      });
      
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("Média");
      setIsTaskDialogOpen(false);
      
      await loadTasks();
      await loadDashboardData(); // Refresh stats
      toast.success("Tarefa criada com sucesso");
    } catch (error: any) {
      console.error("Failed to create task:", error);
      toast.error("Erro ao criar tarefa", {
        description: error?.message || error?.detail || "Não foi possível criar a tarefa",
      });
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) {
      return;
    }

    try {
      await api.delete(`/api/secretary/tasks/${taskId}`);
      await loadTasks();
      await loadDashboardData(); // Refresh stats
      toast.success("Tarefa excluída com sucesso");
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      toast.error("Erro ao excluir tarefa", {
        description: error?.message || error?.detail || "Não foi possível excluir a tarefa",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "scheduled":
      case "agendado":
      case "confirmado":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "cancelado":
        return "bg-red-100 text-red-800";
      case "completed":
      case "concluído":
        return "bg-blue-100 text-blue-800";
      case "checked_in":
      case "check-in":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "scheduled":
        return "Agendado";
      case "cancelled":
        return "Cancelado";
      case "completed":
        return "Concluído";
      case "checked_in":
        return "Check-in";
      case "in_consultation":
        return "Em Consulta";
      default:
        return status || "Pendente";
    }
  };

  const stats = dashboardData ? [
    {
      title: "Agendamentos Hoje",
      value: dashboardData.stats.today_appointments_count.toString(),
      icon: CalendarDays,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
      link: "/secretaria/agendamentos",
    },
    {
      title: "Pacientes Cadastrados",
      value: dashboardData.stats.total_patients_count.toString(),
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/secretaria/cadastros/pacientes",
    },
    {
      title: "Tarefas Pendentes",
      value: dashboardData.stats.pending_tasks_count.toString(),
      icon: ClipboardList,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Agendamentos Confirmados",
      value: dashboardData.stats.confirmed_appointments_count.toString(),
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ] : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-teal-600" />
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Visão geral das atividades do dia
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadDashboardData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Grid */}
      {stats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const content = (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                </CardContent>
              </Card>
            );

            if (stat.link) {
              return (
                <Link key={index} href={stat.link}>
                  {content}
                </Link>
              );
            }
            return <React.Fragment key={index}>{content}</React.Fragment>;
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Não foi possível carregar as estatísticas</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos de Hoje</CardTitle>
            <CardDescription>
              Consultas agendadas para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData && dashboardData.today_appointments.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.today_appointments.map((appointment) => {
                  const appointmentDate = parseISO(appointment.scheduled_datetime);
                  const time = format(appointmentDate, "HH:mm", { locale: ptBR });
                  
                  return (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                          <Clock className="h-6 w-6 text-teal-600" />
                        </div>
                        <div>
                          <div className="font-semibold">{appointment.patient_name}</div>
                          <div className="text-sm text-gray-600">{appointment.doctor_name}</div>
                          <div className="text-xs text-gray-500">{time}</div>
                        </div>
                      </div>
                      <Badge className={getStatusBadge(appointment.status)}>
                        {getStatusLabel(appointment.status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum agendamento para hoje</p>
              </div>
            )}
            <Link href="/secretaria/agendamentos">
              <button className="w-full mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium">
                Ver todos os agendamentos →
              </button>
            </Link>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tarefas Pendentes</CardTitle>
                <CardDescription>
                  Lista de tarefas a realizar
                </CardDescription>
              </div>
              <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Tarefa</DialogTitle>
                    <DialogDescription>
                      Adicione uma nova tarefa à sua lista
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="task-title">Título *</Label>
                      <Input
                        id="task-title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Ex: Confirmar agendamentos de amanhã"
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-description">Descrição</Label>
                      <Textarea
                        id="task-description"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                        placeholder="Adicione uma descrição opcional..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="task-priority">Prioridade</Label>
                      <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                        <SelectTrigger id="task-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baixa">Baixa</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateTask}>
                      Criar Tarefa
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600" />
              </div>
            ) : tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id, task.completed)}
                        className="w-5 h-5 text-teal-600 rounded cursor-pointer"
                        aria-label={`Tarefa: ${task.title}`}
                      />
                      <div className="flex-1">
                        <div className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className={`text-sm text-gray-500 mt-1 ${task.completed ? 'line-through' : ''}`}>
                            {task.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={
                            `${
                              task.priority === "Alta" ? "bg-red-100 text-red-800" :
                              task.priority === "Média" ? "bg-yellow-100 text-yellow-800" :
                              "bg-blue-100 text-blue-800"
                            }`
                          } variant="outline">
                            {task.priority}
                          </Badge>
                          {task.due_date && (
                            <span className="text-xs text-gray-500">
                              {format(parseISO(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhuma tarefa cadastrada</p>
                <p className="text-sm mt-1">Clique em "Nova Tarefa" para adicionar uma</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

