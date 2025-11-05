"use client";

import React, { useState, useEffect } from "react";
import { PatientHeader, PatientSidebar, PatientMobileNav } from "@/components/patient/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  BookOpen,
  Video,
  FileText,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface HelpArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  views?: number;
  helpful?: number;
  created_at: string;
}

interface SupportTicket {
  id: number;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at?: string;
}

export default function PatientHelpPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("articles");
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    priority: "medium" as SupportTicket["priority"],
  });

  // Load help articles and tickets
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load help articles (mock data for now - replace with actual API call)
        // TODO: Replace with actual API endpoint when available
        const mockArticles: HelpArticle[] = [
          {
            id: 1,
            title: "Como agendar uma consulta",
            content: "Para agendar uma consulta, acesse a seção de Agendamentos e clique em 'Agendar Consulta'. Selecione o médico, data e horário desejados.",
            category: "Agendamentos",
            tags: ["agendamento", "consulta", "médico"],
            views: 150,
            helpful: 45,
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            title: "Como acessar meus resultados de exames",
            content: "Os resultados de exames ficam disponíveis na seção 'Resultados de Exames'. Você receberá uma notificação quando novos resultados estiverem disponíveis.",
            category: "Exames",
            tags: ["exames", "resultados", "laboratório"],
            views: 120,
            helpful: 38,
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            title: "Como fazer uma consulta virtual",
            content: "Acesse a seção de Telemedicina e agende uma consulta virtual. Você receberá um link para acessar a videoconferência no horário agendado.",
            category: "Telemedicina",
            tags: ["telemedicina", "virtual", "vídeo"],
            views: 95,
            helpful: 32,
            created_at: new Date().toISOString(),
          },
          {
            id: 4,
            title: "Como visualizar minhas prescrições",
            content: "Todas as suas prescrições ficam disponíveis na seção 'Prescrições'. Você pode visualizar, baixar em PDF e enviar para farmácias.",
            category: "Prescrições",
            tags: ["prescrição", "medicamentos", "farmácia"],
            views: 88,
            helpful: 28,
            created_at: new Date().toISOString(),
          },
          {
            id: 5,
            title: "Como atualizar meus dados pessoais",
            content: "Acesse Configurações > Perfil para atualizar seus dados pessoais, informações de contato e foto de perfil.",
            category: "Perfil",
            tags: ["perfil", "dados", "configurações"],
            views: 75,
            helpful: 25,
            created_at: new Date().toISOString(),
          },
        ];
        
        setArticles(mockArticles);

        // Load support tickets
        try {
          // TODO: Replace with actual API endpoint when available
          // const ticketsData = await api.get<SupportTicket[]>("/api/support/tickets");
          // setTickets(ticketsData);
          setTickets([]);
        } catch (error) {
          console.error("Failed to load tickets:", error);
          setTickets([]);
        }
      } catch (error) {
        console.error("Failed to load help data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateTicket = async () => {
    try {
      // TODO: Replace with actual API call when endpoint is available
      // await api.post("/api/support/tickets", ticketForm);
      
      // For now, show success message
      alert("Ticket de suporte criado com sucesso! Nossa equipe entrará em contato em breve.");
      setShowTicketForm(false);
      setTicketForm({ subject: "", description: "", priority: "medium" });
      
      // Reload tickets
      // const ticketsData = await api.get<SupportTicket[]>("/api/support/tickets");
      // setTickets(ticketsData);
    } catch (error) {
      console.error("Failed to create ticket:", error);
      alert("Erro ao criar ticket. Tente novamente.");
    }
  };

  const filteredArticles = articles.filter((article) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.category.toLowerCase().includes(query) ||
      article.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const categories = Array.from(new Set(articles.map((a) => a.category)));

  const getStatusColor = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: SupportTicket["status"]) => {
    switch (status) {
      case "open":
        return "Aberto";
      case "in_progress":
        return "Em Andamento";
      case "resolved":
        return "Resolvido";
      case "closed":
        return "Fechado";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityLabel = (priority: SupportTicket["priority"]) => {
    switch (priority) {
      case "urgent":
        return "Urgente";
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return priority;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <PatientHeader showSearch={false} />
      <PatientMobileNav />

      <div className="flex">
        <div className="hidden lg:block">
          <PatientSidebar />
        </div>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[#0F4C75] mb-2">Central de Ajuda</h1>
            <p className="text-[#5D737E]">Encontre respostas para suas dúvidas ou entre em contato com nosso suporte</p>
          </div>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="medical-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#1B9AAA]/10 flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-[#1B9AAA]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F4C75]">Chat ao Vivo</h3>
                    <p className="text-sm text-[#5D737E]">Disponível 24/7</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#16C79A]/10 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-[#16C79A]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F4C75]">Telefone</h3>
                    <p className="text-sm text-[#5D737E]">(11) 3000-0000</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="medical-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#0F4C75]/10 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-[#0F4C75]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0F4C75]">E-mail</h3>
                    <p className="text-sm text-[#5D737E]">suporte@prontivus.com</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <Card className="medical-card mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Pesquisar artigos de ajuda..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="articles" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Artigos de Ajuda
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Meus Tickets
              </TabsTrigger>
            </TabsList>

            {/* Articles Tab */}
            <TabsContent value="articles" className="space-y-6">
              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Button
                  variant={searchQuery === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className={searchQuery === "" ? "bg-[#0F4C75] text-white" : ""}
                >
                  Todos
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(category)}
                    className={searchQuery === category ? "bg-[#0F4C75] text-white" : ""}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              {/* Articles List */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0F4C75] mx-auto"></div>
                  <p className="mt-4 text-[#5D737E]">Carregando artigos...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <Card className="medical-card">
                  <CardContent className="p-12 text-center">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-[#5D737E]">Nenhum artigo encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArticles.map((article) => (
                    <Card
                      key={article.id}
                      className="medical-card hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg text-[#0F4C75] pr-4">
                            {article.title}
                          </CardTitle>
                          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                          {article.views && (
                            <span className="text-xs text-gray-500">
                              {article.views} visualizações
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-[#5D737E] line-clamp-2">
                          {article.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Support Tickets Tab */}
            <TabsContent value="support" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-[#0F4C75]">Meus Tickets de Suporte</h2>
                <Button
                  onClick={() => setShowTicketForm(true)}
                  className="bg-[#0F4C75] hover:bg-[#1B9AAA] text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Novo Ticket
                </Button>
              </div>

              {tickets.length === 0 ? (
                <Card className="medical-card">
                  <CardContent className="p-12 text-center">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-[#5D737E] mb-4">Você ainda não tem tickets de suporte</p>
                    <Button
                      onClick={() => setShowTicketForm(true)}
                      className="bg-[#0F4C75] hover:bg-[#1B9AAA] text-white"
                    >
                      Criar Primeiro Ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id} className="medical-card">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-[#0F4C75] mb-2">
                              {ticket.subject}
                            </CardTitle>
                            <div className="flex gap-2 mb-2">
                              <Badge className={getStatusColor(ticket.status)}>
                                {getStatusLabel(ticket.status)}
                              </Badge>
                              <Badge className={getPriorityColor(ticket.priority)}>
                                {getPriorityLabel(ticket.priority)}
                              </Badge>
                            </div>
                            <p className="text-sm text-[#5D737E] line-clamp-2">
                              {ticket.description}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Criado em {new Date(ticket.created_at).toLocaleDateString("pt-BR")}</span>
                          {ticket.updated_at && (
                            <span>Atualizado em {new Date(ticket.updated_at).toLocaleDateString("pt-BR")}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Article Detail Modal */}
          {selectedArticle && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="medical-card max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-[#0F4C75] mb-2">
                        {selectedArticle.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{selectedArticle.category}</Badge>
                        {selectedArticle.views && (
                          <span className="text-xs text-gray-500">
                            {selectedArticle.views} visualizações
                          </span>
                        )}
                        {selectedArticle.helpful !== undefined && (
                          <span className="text-xs text-gray-500">
                            {selectedArticle.helpful} pessoas acharam útil
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedArticle(null)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-[#5D737E] whitespace-pre-line">{selectedArticle.content}</p>
                  </div>
                  {selectedArticle.tags.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <p className="text-sm font-medium text-[#0F4C75] mb-2">Tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedArticle.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex gap-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // TODO: Mark as helpful
                        alert("Obrigado pelo feedback!");
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Foi Útil
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedArticle(null);
                        setShowTicketForm(true);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Preciso de Mais Ajuda
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Create Ticket Modal */}
          {showTicketForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <Card className="medical-card max-w-2xl w-full">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#0F4C75]">Criar Ticket de Suporte</CardTitle>
                  <CardDescription>
                    Descreva seu problema ou dúvida e nossa equipe entrará em contato
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#0F4C75] mb-2 block">
                      Assunto
                    </label>
                    <Input
                      value={ticketForm.subject}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, subject: e.target.value })
                      }
                      placeholder="Ex: Problema ao agendar consulta"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0F4C75] mb-2 block">
                      Descrição
                    </label>
                    <textarea
                      value={ticketForm.description}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, description: e.target.value })
                      }
                      placeholder="Descreva detalhadamente seu problema ou dúvida..."
                      className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F4C75]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0F4C75] mb-2 block">
                      Prioridade
                    </label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) =>
                        setTicketForm({
                          ...ticketForm,
                          priority: e.target.value as SupportTicket["priority"],
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0F4C75]"
                      title="Selecione a prioridade do ticket"
                      aria-label="Prioridade do ticket"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowTicketForm(false);
                        setTicketForm({ subject: "", description: "", priority: "medium" });
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 bg-[#0F4C75] hover:bg-[#1B9AAA] text-white"
                      onClick={handleCreateTicket}
                      disabled={!ticketForm.subject || !ticketForm.description}
                    >
                      Enviar Ticket
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

